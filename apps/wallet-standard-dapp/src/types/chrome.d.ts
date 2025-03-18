interface Window {
  chrome?: {
    runtime: {
      sendMessage: (
        extensionId: string,
        message: any,
        options?: any,
        callback?: (response: any) => void
      ) => void;
    };
  };
}
