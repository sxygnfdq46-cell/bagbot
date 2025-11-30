import { continuousRuntime } from "@/lib/runtime/ContinuousRuntimeLoop";

export async function POST(request: Request) {
  try {
    const { command, speed } = await request.json();

    if (command === "start") {
      continuousRuntime.start(speed || 1000);
      return Response.json({ status: "Runtime loop started" });
    }

    if (command === "stop") {
      continuousRuntime.stop();
      return Response.json({ status: "Runtime loop stopped" });
    }

    return Response.json({ error: "Unknown command" }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: "Runtime API Failure", details: String(err) },
      { status: 500 }
    );
  }
}
