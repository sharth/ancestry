import { ChunkStreamByNewline } from './chunkStreamByNewline'

class ReadableStreamFromArray extends ReadableStream<string> {
    constructor(array: Array<string>) {
        super({
            start: (controller) => {
                array.forEach((line) => controller.enqueue(line))
                controller.close()
            }
        })
    }
}

class WritableStreamToArray extends WritableStream<string> {
    constructor(array: Array<string>) {
        super({
            write: (line: string) => {
                array.push(line);
            }
        })
    }
}

it('HappyPath', () => {
    const lines = new Array<string>
    new ReadableStreamFromArray(["Line 1\n", "Line 2\n", "Line 3\nLine 4", "\nLine ", "5"])
        .pipeThrough(new ChunkStreamByNewline())
        .pipeTo(new WritableStreamToArray(lines))
        .then(() => {
            expect(lines).toEqual(["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"])
        })
})
