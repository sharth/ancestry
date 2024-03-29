export class ChunkStreamByNewline extends TransformStream {
  constructor () {
    let incompleteLine = ''
    super({
      start (controller) {
        incompleteLine = ''
      },
      transform (chunk, controller) {
        const lines = (incompleteLine + chunk).split(/\r?\n/)
        incompleteLine = lines.pop() ?? ''
        for (const line of lines) {
          controller.enqueue(line)
        }
      },
      flush (controller) {
        if (incompleteLine !== '') {
          controller.enqueue(incompleteLine)
        }
      }
    })
  }
};
