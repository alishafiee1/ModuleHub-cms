/** Shape of an HTTP request log line written by the CMS logger */
export interface HttpRequestLogFields {
  method: string;
  path: string;
  status: number;
}
