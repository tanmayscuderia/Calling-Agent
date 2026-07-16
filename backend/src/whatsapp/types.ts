export interface ParsedWhatsAppMessage {
  externalMessageId: string;
  chatId: string;
  senderId: string;
  senderPhone: string | null;
  senderName?: string | null;
  isGroup: boolean;
  text: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'unknown';
  /** Media download URL if media was downloaded and stored */
  mediaUrl?: string | null;
  /** MIME type of attached media */
  mediaMimeType?: string | null;
  /** Original filename for documents */
  mediaFileName?: string | null;
  raw: any;
  receivedAt: string;
}

export interface MessagingAdapter {
  start(): Promise<void>;
  stop(): Promise<void>;
  sendMessage(chatId: string, text: string): Promise<void>;
  /** Send a media file (image/document) with optional caption */
  sendMedia?(chatId: string, opts: { url?: string; buffer?: Buffer; fileName?: string; caption?: string; mimeType?: string }): Promise<void>;
  /** Send a location pin (latitude, longitude, optional place name) */
  sendLocation?(chatId: string, opts: { latitude: number; longitude: number; name?: string; address?: string }): Promise<void>;
  getStatus(): Promise<any>;
}
