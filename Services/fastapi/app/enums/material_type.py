from enum import Enum


class MaterialType(str, Enum):
    """Допустимые типы биоматериала образца."""

    BLOOD = "blood"
    TISSUE = "tissue"
    DNA = "dna"
    RNA = "rna"
    PROTEIN = "protein"
    CELLS = "cells"
    BACTERIA = "bacteria"
    VIRUSES = "viruses"
    OTHER = "other"


MATERIAL_TYPE_LABELS = {
    MaterialType.BLOOD: "Кровь",
    MaterialType.TISSUE: "Ткань",
    MaterialType.DNA: "ДНК",
    MaterialType.RNA: "РНК",
    MaterialType.PROTEIN: "Белок",
    MaterialType.CELLS: "Клетки",
    MaterialType.BACTERIA: "Бактерии",
    MaterialType.VIRUSES: "Вирусы",
    MaterialType.OTHER: "Другое",
}
