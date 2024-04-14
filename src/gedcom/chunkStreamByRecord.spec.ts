import { ChunkStreamByRecord } from "./chunkStreamByRecord";
import { GedcomRecord } from "./gedcomRecord";

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

class ToArray<T> extends WritableStream<T> {
    constructor(array: Array<T>) {
        super({
            write: (line: T) => {
                array.push(line);
            }
        })
    }
}

it('HappyPath', () => {
    let records = new Array<GedcomRecord>
    new FromArray(['0 @I1@ INDI', '0 @I2@ INDI', '1 SEX M'])
        .pipeThrough(new ChunkStreamByRecord())
        .pipeTo(new ToArray(records))
        .then(() => {
            expect(records).toEqual([
                new GedcomRecord(0, "@I1@", "INDI", "INDI", undefined),
                new GedcomRecord(0, "@I2@", "INDI", "INDI", undefined, [
                    new GedcomRecord(1, undefined, "SEX", "INDI.SEX", "M"),
                ]),
            ])
        })
})

it('ConcAndCont', () => {
    let records = new Array<GedcomRecord>
    new FromArray(['0 STR Hello ', '1 CONT How ', '1 CONC are you?'])
        .pipeThrough(new ChunkStreamByRecord())
        .pipeTo(new ToArray(records))
        .then(() => {
            expect(records).toEqual([
                new GedcomRecord(0, undefined, "STR", "STR", "Hello \nHow are you?"),
            ])
        })
})
