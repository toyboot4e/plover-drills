import eng_to_ipa as ipa


def to_ipa(w: str) -> str:
    lambda xs: " ".join(map(f, xs)).split()
    return "".join(map(lambda s: f"/{s}/", ipa.convert(w).split()))
