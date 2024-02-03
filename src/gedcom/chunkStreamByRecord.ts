import { GedcomRecord } from './gedcomRecord'

export class ChunkStreamByRecord extends TransformStream {
  constructor () {
    let ladder = new Array<GedcomRecord>()
    super({
      transform (chunk: string, controller) {
        const match = chunk.match(/^([0-9]+) *(@[^@]+@)? *([A-Za-z0-9_]+) *(.+)?$/)
        if (match == null) {
          throw new Error()
        }

        const level = parseInt(match[1], 10)
        const [xref, tag, value] = match.slice(2)
        const abstag = [...ladder.slice(0, level).map(record => record.tag), tag].join('.')
        const record = new GedcomRecord(level, xref, tag, abstag, value)

        if (record.level === 0) {
          if (ladder.length > 0) { controller.enqueue(ladder[0]) }
          ladder = [record]
        } else if (record.tag === 'CONC') {
          ladder.at(-1)!.value! += record.value
        } else if (record.tag === 'CONT') {
          ladder.at(-1)!.value! += '\n' + (record.value ?? '')
        } else {
          ladder.length = record.level
          ladder.at(-1)!.children.push(record)
          ladder.push(record)
        }
      },
      flush (controller) {
        if (ladder.length > 0) {
          controller.enqueue(ladder[0])
        }
      }
    })
  }
};
