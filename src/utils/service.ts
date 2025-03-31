export class ServiceFunctions{
    public static getMessagePreview = (type:string, message:string) => {
        switch (type) {
          case 'image':
            return '📷 Image';
          case 'audio':
            return '🎵 Audio';
          case 'video':
            return '📹 Video';
          case 'file':
            return '📁 File';
          case 'text':
            return message;
          default:
            return 'No messages yet';
        }
      };
    
    
}