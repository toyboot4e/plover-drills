import pronouncing
from phonecodes import phonecodes


def to_ipa(w: str) -> str:
    arps = pronouncing.phones_for_word(w.lower())
    if not arps:
        return ""
    return phonecodes.arpabet2ipa(arps[0])  # ARPAbet → IPA
