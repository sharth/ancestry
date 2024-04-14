import { ChunkStreamByNewline } from './chunkStreamByNewline'

class FromArray extends ReadableStream<string> {
    constructor(array: Array<string>) {
        super({
            start: (controller) => {
                array.forEach((line) => controller.enqueue(line))
                controller.close()
            }
        })
    }
}

class ToArray extends WritableStream<string> {
    constructor(array: Array<string>) {
        super({
            write: (line: string) => {
                array.push(line);
            }
        })
    }
}

it('HappyPath', () => {
    let lines = new Array<string>
    new FromArray(["Line 1\n", "Line 2\n", "Line 3\nLine 4", "\nLine ", "5"])
        .pipeThrough(new ChunkStreamByNewline())
        .pipeTo(new ToArray(lines))
        .then(() => {
            expect(lines).toEqual(["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"])
        })
})
