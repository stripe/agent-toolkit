import http from 'http';
import path from 'path';

const USER_AGENT = 'stripe-agent-toolkit/0.1';

export function internalStripeFetch<T, TResult>(
  url: string,
  method: 'GET' | 'POST',
  body: T
): Promise<TResult> {
  return new Promise<TResult>((resolve, reject) => {
    const request = http.request(
      // certproxy weirdness:
      url.replace(/^https:/, 'http:'),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': USER_AGENT,
        },
        method,
        socketPath: path.join(process.env.HOME!, '.stripeproxy'),
      },
      (response: any) => {
        const chunks: string[] = [];
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => chunks.push(chunk));
        response.on('end', () => {
          if (response.headers['x-stripe-u2f-challenge']) {
            reject(
              new Error(
                'Received an auth challenge while calling the model API. Do you need to run sc-2fa?'
              )
            );
          } else {
            try {
              const result = chunks.join('');
              resolve(JSON.parse(result));
            } catch (error) {
              reject(error);
            }
          }
        });
      }
    );

    request.on('error', (error: any) => reject(error));
    if (method === 'POST') {
      request.write(JSON.stringify(body));
    }
    request.end();
  });
}
