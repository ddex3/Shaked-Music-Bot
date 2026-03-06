import { Track } from "./Track";
import { Config } from "../config/config";

export class Queue {
  private tracks: Track[] = [];

  public get length(): number {
    return this.tracks.length;
  }

  public get isEmpty(): boolean {
    return this.tracks.length === 0;
  }

  public getAll(): Track[] {
    return [...this.tracks];
  }

  public getTrack(index: number): Track | undefined {
    return this.tracks[index];
  }

  public add(track: Track): boolean {
    if (this.tracks.length >= Config.maxQueueSize) {
      return false;
    }
    this.tracks.push(track);
    return true;
  }

  public addMany(tracks: Track[]): number {
    const available = Config.maxQueueSize - this.tracks.length;
    const toAdd = tracks.slice(0, available);
    this.tracks.push(...toAdd);
    return toAdd.length;
  }

  public addNext(track: Track): boolean {
    if (this.tracks.length >= Config.maxQueueSize) {
      return false;
    }
    this.tracks.unshift(track);
    return true;
  }

  public remove(index: number): Track | undefined {
    if (index < 0 || index >= this.tracks.length) {
      return undefined;
    }
    return this.tracks.splice(index, 1)[0];
  }

  public move(from: number, to: number): boolean {
    if (
      from < 0 ||
      from >= this.tracks.length ||
      to < 0 ||
      to >= this.tracks.length
    ) {
      return false;
    }
    const [track] = this.tracks.splice(from, 1);
    this.tracks.splice(to, 0, track);
    return true;
  }

  public shuffle(): void {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  public clear(): void {
    this.tracks = [];
  }

  public getNext(): Track | undefined {
    return this.tracks.shift();
  }

  public peek(): Track | undefined {
    return this.tracks[0];
  }

  public getTotalDuration(): number {
    return this.tracks.reduce((sum, track) => sum + track.duration, 0);
  }
}
