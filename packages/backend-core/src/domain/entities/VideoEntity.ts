export class VideoEntity {
    constructor(
        public readonly url: string,
        public readonly title: string,
        public readonly publishedAt: string,
        public readonly thumbnailUrl: string,
        public readonly channelTitle: string
    ) { }
}
