import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

const ASR_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=qwen3-asr-flash-realtime";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audioFile = formData.get("audio") as Blob;

  if (!audioFile) {
    return NextResponse.json({ error: "audio required" }, { status: 400 });
  }

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DASHSCOPE_API_KEY not configured" }, { status: 500 });
  }

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    console.info(`[ASR:${requestId}] start`, {
      bytes: audioBuffer.length,
      mimeType: audioFile.type || "unknown",
    });

    const transcript = await transcribeAudio(audioBuffer, apiKey, requestId);

    console.info(`[ASR:${requestId}] success`, {
      transcriptLength: transcript.length,
      preview: transcript.slice(0, 80),
    });

    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error(`[ASR:${requestId}] failed`, error);
    return NextResponse.json({ error: "ASR failed" }, { status: 500 });
  }
}

function transcribeAudio(audioBuffer: Buffer, apiKey: string, requestId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ASR_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    let transcript = "";
    let settled = false;

    const finish = (result: { ok: true; transcript: string } | { ok: false; error: Error }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      if (result.ok) {
        resolve(result.transcript);
      } else {
        reject(result.error);
      }
    };

    const timeout = setTimeout(() => {
      finish({ ok: false, error: new Error("ASR timeout") });
    }, 30000);

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          event_id: `evt_${Date.now()}_1`,
          type: "session.update",
          session: {
            modalities: ["text"],
            input_audio_format: "pcm",
            sample_rate: 16000,
            input_audio_transcription: { language: "zh" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.0,
              silence_duration_ms: 400,
            },
          },
        })
      );

      const chunkSize = 3200;
      for (let i = 0; i < audioBuffer.length; i += chunkSize) {
        const chunk = audioBuffer.subarray(i, Math.min(i + chunkSize, audioBuffer.length));
        ws.send(
          JSON.stringify({
            event_id: `evt_${Date.now()}_${i}`,
            type: "input_audio_buffer.append",
            audio: chunk.toString("base64"),
          })
        );
      }

      ws.send(
        JSON.stringify({
          event_id: `evt_${Date.now()}_fin`,
          type: "session.finish",
        })
      );
    });

    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "conversation.item.input_audio_transcription.completed") {
          transcript += msg.transcript || "";
          console.info(`[ASR:${requestId}] transcript chunk`, {
            transcriptLength: transcript.length,
          });
        } else if (msg.type === "session.finished" || msg.type === "error") {
          if (msg.type === "error") {
            finish({ ok: false, error: new Error(msg.error?.message || "ASR error") });
          } else if (!transcript.trim()) {
            finish({ ok: false, error: new Error("ASR finished with empty transcript") });
          } else {
            finish({ ok: true, transcript });
          }
        }
      } catch {
        // Ignore provider messages that are not JSON payloads we care about.
      }
    });

    ws.on("error", (err) => {
      finish({ ok: false, error: err });
    });

    ws.on("close", () => {
      if (settled) return;
      if (!transcript.trim()) {
        finish({ ok: false, error: new Error("ASR socket closed before transcript completed") });
      } else {
        finish({ ok: true, transcript });
      }
    });
  });
}
