export type FileUploadData = {
  uri: string;
  type?: string;
  name?: string;
};

export const fileApi = {
  uploadFile: async (file: FileUploadData, _module: string, _recordId: string) => ({
    url: file.uri,
    files: [
      {
        url: file.uri,
        filename: file.name || 'upload.jpg',
        type: file.type || 'image/jpeg',
      },
    ],
  }),
};
