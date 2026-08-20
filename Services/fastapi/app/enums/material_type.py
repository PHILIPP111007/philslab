from enum import Enum


class MaterialType(str, Enum):
    """Допустимые типы биоматериала образца."""

    BLOOD = "Кровь"
    TISSUE = "Ткань"
    DNA = "ДНК"
    RNA = "РНК"
    PROTEIN = "Белок"
    CELLS = "Клетки"
    BACTERIA = "Бактерии"
    VIRUSES = "Вирусы"
    OTHER = "Другое"


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
