export interface SourceModel {
    abbr: string
    title: string
    text: string
    repositories: {
        repositoryXref: string
        callNumber: string
    }[]
}
