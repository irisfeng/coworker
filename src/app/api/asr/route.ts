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

  try {
    const transcript = await transcribeAudio(audioBuffer, apiKey);
    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error("ASR error:", error);
    return NextResponse.json({ error: "ASR failed" }, { status: 500 });
  }
}

function transcribeAudio(audioBuffer: Buffer, apiKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(ASR_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    let transcript = "";
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("ASR timeout"));
    }, 30000);

    ws.on("open", () => {
      // Send session config
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

      // Send audio in chunks (3200 bytes each)
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

      // Signal end
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
        } else if (msg.type === "session.finished" || msg.type === "error") {
          clearTimeout(timeout);
          ws.close();
          if (msg.type === "error") {
            reject(new Error(msg.error?.message || "ASR error"));
          } else {
            resolve(transcript);
          }
        }
      } catch {
        // ignore parse errors
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      resolve(transcript);
    });
  });
}
