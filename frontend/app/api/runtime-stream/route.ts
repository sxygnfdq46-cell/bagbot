import { NextResponse } from 'next/server';
import { eventBus } from "../../../app/lib/runtime/eventBus";

// Mark this route as dynamic (cannot be statically exported)
export const dynamic = 'force-dynamic';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const listener = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      eventBus.on("tick", listener);

      controller.enqueue(`retry: 2000\n\n`);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
