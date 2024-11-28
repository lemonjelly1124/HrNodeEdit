/* eslint-disable @typescript-eslint/no-explicit-any */
// global.d.ts
interface Window {
    acquireVsCodeApi(): {
        postMessage: (message) => void;
        getState: () => any;
        setState: (state: any) => void;
    };
}
