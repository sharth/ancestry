export interface GedcomEventMetadata {
  humanReadableDescription: string;
  mandatoryValue: boolean;
  mandatoryType: boolean;
}

export const gedcomIndividualAttributes: Record<string, GedcomEventMetadata> = {
  // n CAST <Text>                              {1:1}  g7:CAST
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  CAST: {
    humanReadableDescription: "Caste",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n DSCR <Text>                              {1:1}  g7:DSCR
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  DSCR: {
    humanReadableDescription: "Physical Description",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n EDUC <Text>                              {1:1}  g7:EDUC
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  EDUC: {
    humanReadableDescription: "Education",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n IDNO <Special>                           {1:1}  g7:IDNO
  //   +1 TYPE <Text>                           {1:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  IDNO: {
    humanReadableDescription: "ID Number",
    mandatoryValue: true,
    mandatoryType: true,
  },
  // n NATI <Text>                              {1:1}  g7:NATI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  NATI: {
    humanReadableDescription: "Nationality",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n NCHI <Integer>                           {1:1}  g7:INDI-NCHI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  NCHI: {
    humanReadableDescription: "Number of Children",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n NMR <Integer>                            {1:1}  g7:NMR
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  NMR: {
    humanReadableDescription: "Number of Marriages",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n OCCU <Text>                              {1:1}  g7:OCCU
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  OCCU: {
    humanReadableDescription: "Occupation",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n PROP <Text>                              {1:1}  g7:PROP
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  PROP: {
    humanReadableDescription: "Property",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n RELI <Text>                              {1:1}  g7:INDI-RELI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  RELI: {
    humanReadableDescription: "Religion",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n RESI <Text>                              {1:1}  g7:INDI-RESI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  RESI: {
    humanReadableDescription: "Residence",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n SSN <Special>                            {1:1}  g7:SSN
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  SSN: {
    humanReadableDescription: "Social Security Number",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n TITL <Text>                              {1:1}  g7:INDI-TITL
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  TITL: {
    humanReadableDescription: "Title",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n FACT <Text>                              {1:1}  g7:INDI-FACT
  //   +1 TYPE <Text>                           {1:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  FACT: {
    humanReadableDescription: "Fact",
    mandatoryValue: true,
    mandatoryType: true,
  },
};

export const gedcomIndividualEvents: Record<string, GedcomEventMetadata> = {
  // n ADOP [Y|<NULL>]                          {1:1}  g7:ADOP
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  //   +1 FAMC @<XREF:FAM>@                     {0:1}  g7:ADOP-FAMC
  //      +2 ADOP <Enum>                        {0:1}  g7:FAMC-ADOP
  //         +3 PHRASE <Text>                   {0:1}  g7:PHRASE
  ADOP: {
    humanReadableDescription: "Adoption",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n BAPM [Y|<NULL>]                          {1:1}  g7:BAPM
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  BAPM: {
    humanReadableDescription: "Baptism",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n BARM [Y|<NULL>]                          {1:1}  g7:BARM
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  BARM: {
    humanReadableDescription: "Bar Mitzvah",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n BASM [Y|<NULL>]                          {1:1}  g7:BASM
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  BASM: {
    humanReadableDescription: "Bas Mitzvah",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n BIRT [Y|<NULL>]                          {1:1}  g7:BIRT
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  //   +1 FAMC @<XREF:FAM>@                     {0:1}  g7:FAMC
  BIRT: {
    humanReadableDescription: "Birth",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n BLES [Y|<NULL>]                          {1:1}  g7:BLES
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  BLES: {
    humanReadableDescription: "Blessing",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n BURI [Y|<NULL>]                          {1:1}  g7:BURI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  BURI: {
    humanReadableDescription: "Burial",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n CENS [Y|<NULL>]                          {1:1}  g7:INDI-CENS
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  CENS: {
    humanReadableDescription: "Census",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n CHR [Y|<NULL>]                           {1:1}  g7:CHR
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  //   +1 FAMC @<XREF:FAM>@                     {0:1}  g7:FAMC
  CHR: {
    humanReadableDescription: "Christening",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n CHRA [Y|<NULL>]                          {1:1}  g7:CHRA
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  CHRA: {
    humanReadableDescription: "Adult Christening",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n CONF [Y|<NULL>]                          {1:1}  g7:CONF
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  CONF: {
    humanReadableDescription: "Confirmation",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n CREM [Y|<NULL>]                          {1:1}  g7:CREM
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  CREM: {
    humanReadableDescription: "Cremation",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n DEAT [Y|<NULL>]                          {1:1}  g7:DEAT
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  DEAT: {
    humanReadableDescription: "Death",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n EMIG [Y|<NULL>]                          {1:1}  g7:EMIG
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  EMIG: {
    humanReadableDescription: "Emigration",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n FCOM [Y|<NULL>]                          {1:1}  g7:FCOM
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  FCOM: {
    humanReadableDescription: "First Communion",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n GRAD [Y|<NULL>]                          {1:1}  g7:GRAD
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  GRAD: {
    humanReadableDescription: "Graduation",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n IMMI [Y|<NULL>]                          {1:1}  g7:IMMI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  IMMI: {
    humanReadableDescription: "Immigration",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n NATU [Y|<NULL>]                          {1:1}  g7:NATU
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  NATU: {
    humanReadableDescription: "Naturalization",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n ORDN [Y|<NULL>]                          {1:1}  g7:ORDN
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  ORDN: {
    humanReadableDescription: "Ordination",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n PROB [Y|<NULL>]                          {1:1}  g7:PROB
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  PROB: {
    humanReadableDescription: "Probate",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n RETI [Y|<NULL>]                          {1:1}  g7:RETI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  RETI: {
    humanReadableDescription: "Retirement",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n WILL [Y|<NULL>]                          {1:1}  g7:WILL
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  WILL: {
    humanReadableDescription: "Will",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n EVEN <Text>                              {1:1}  g7:INDI-EVEN
  //   +1 TYPE <Text>                           {1:1}  g7:TYPE
  //   +1 <<INDIVIDUAL_EVENT_DETAIL>>           {0:1}
  EVEN: {
    humanReadableDescription: "Event",
    mandatoryValue: true,
    mandatoryType: true,
  },
};

export const gedcomFamilyAttributes: Record<string, GedcomEventMetadata> = {
  // n NCHI <Integer>                           {1:1}  g7:FAM-NCHI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  NCHI: {
    humanReadableDescription: "Number of Children",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n RESI <Text>                              {1:1}  g7:FAM-RESI
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  RESI: {
    humanReadableDescription: "Residence",
    mandatoryValue: true,
    mandatoryType: false,
  },
  // n FACT <Text>                              {1:1}  g7:FAM-FACT
  //   +1 TYPE <Text>                           {1:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  FACT: {
    humanReadableDescription: "Fact",
    mandatoryValue: true,
    mandatoryType: true,
  },
};

export const gedcomFamilyEvents: Record<string, GedcomEventMetadata> = {
  // n ANUL [Y|<NULL>]                          {1:1}  g7:ANUL
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  ANUL: {
    humanReadableDescription: "Annulment",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n CENS [Y|<NULL>]                          {1:1}  g7:FAM-CENS
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  CENS: {
    humanReadableDescription: "Census",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n DIV [Y|<NULL>]                           {1:1}  g7:DIV
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  DIV: {
    humanReadableDescription: "Divorce",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n DIVF [Y|<NULL>]                          {1:1}  g7:DIVF
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  DIVF: {
    humanReadableDescription: "Divorce Filing",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n ENGA [Y|<NULL>]                          {1:1}  g7:ENGA
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  ENGA: {
    humanReadableDescription: "Engagement",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n MARB [Y|<NULL>]                          {1:1}  g7:MARB
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  MARB: {
    humanReadableDescription: "Marriage Bann",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n MARC [Y|<NULL>]                          {1:1}  g7:MARC
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  MARC: {
    humanReadableDescription: "Marriage Contract",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n MARL [Y|<NULL>]                          {1:1}  g7:MARL
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  MARL: {
    humanReadableDescription: "Marriage License",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n MARR [Y|<NULL>]                          {1:1}  g7:MARR
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  MARR: {
    humanReadableDescription: "Marriage",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n MARS [Y|<NULL>]                          {1:1}  g7:MARS
  //   +1 TYPE <Text>                           {0:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  MARS: {
    humanReadableDescription: "Marriage Settlement",
    mandatoryValue: false,
    mandatoryType: false,
  },
  // n EVEN <Text>                              {1:1}  g7:FAM-EVEN
  //   +1 TYPE <Text>                           {1:1}  g7:TYPE
  //   +1 <<FAMILY_EVENT_DETAIL>>               {0:1}
  EVEN: {
    humanReadableDescription: "Event",
    mandatoryValue: true,
    mandatoryType: true,
  },
};
