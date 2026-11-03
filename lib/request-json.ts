export class RequestInputError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
  }
}

/** Bound the actual stream, including chunked requests without Content-Length. */
export async function readJsonObject(request: Request, maxBytes = 8192): Promise<Record<string, unknown>> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestInputError('Content-Type must be application/json', 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestInputError('Invalid JSON body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RequestInputError('Request body is too large', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new RequestInputError('Invalid JSON body');
  }
}
