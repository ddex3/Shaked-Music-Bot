import { TrackData } from "../types";

export class Track {
  public readonly title: string;
  public readonly url: string;
  public readonly duration: number;
  public readonly thumbnail: string;
  public readonly requestedBy: string;

  constructor(data: TrackData) {
    this.title = data.title;
    this.url = data.url;
    this.duration = data.duration;
    this.thumbnail = data.thumbnail;
    this.requestedBy = data.requestedBy;
  }

  public formatDuration(): string {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;
    const pad = (n: number): string => n.toString().padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  public toData(): TrackData {
    return {
      title: this.title,
      url: this.url,
      duration: this.duration,
      thumbnail: this.thumbnail,
      requestedBy: this.requestedBy,
    };
  }
}
