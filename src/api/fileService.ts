export type UploadedFile = {
  type?: string;
  url: string;
  filename: string;
  [key: string]: any;
};

export const fileService = {
  uploadFiles: async (files: any[]): Promise<UploadedFile[]> =>
    files.map((file, index) => ({
      url: typeof file === 'string' ? file : file.uri,
      filename:
        (typeof file === 'object' ? file.name : null) ||
        `upload-${index + 1}.jpg`,
      type: (typeof file === 'object' ? file.type : null) || 'image/jpeg',
    })),
};
