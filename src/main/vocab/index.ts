type VocabKey = string;

const VOCAB_MAP: Record<VocabKey, readonly string[]> = {
  dwc_basisOfRecord: [
    'MaterialEntity',
    'PreservedSpecimen',
    'FossilSpecimen',
    'LivingSpecimen',
    'HumanObservation',
    'MaterialSample',
    'MachineObservation',
    'Event',
    'Taxon',
    'Occurrence',
    'MaterialCitation',
  ],
  dwc_sex: ['male', 'female', 'unknown'],
  dwc_lifeStage: ['juvenile', 'adult', 'subadult', 'larva', 'pupa'],
  dwc_kingdom: [
    'Animalia',
    'Archaea',
    'Bacteria',
    'Chromista',
    'Fungi',
    'Plantae',
    'Protozoa',
    'Viruses',
  ],
  dwc_type: [
    'StillImage',
    'MovingImage',
    'Sound',
    'PhysicalObject',
    'Event',
    'Text',
  ],
  dwc_typeStatus: [
    'HOLOTYPE',
    'PARATYPE',
    'ISOTYPE',
    'ALLOTYPE',
    'SYNTYPE',
    'LECTOTYPE',
    'PARALECTOTYPE',
    'NEOTYPE',
    'TOPOTYPE',
  ],
  dwc_occurrenceStatus: ['present', 'absent'],
};

export function getVocabItems(vocabKey: VocabKey): string[] {
  return [...(VOCAB_MAP[vocabKey] ?? [])];
}
