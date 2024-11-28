import { useState } from 'react'
import { join } from 'path-browserify'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const webviewPublicPath = ((window as any).__webview_public_path__ as string) ?? ''
export function useWebviewPublicPath(relativePath: string) {
  const path = join(webviewPublicPath, relativePath)
  return useState(path)
}
