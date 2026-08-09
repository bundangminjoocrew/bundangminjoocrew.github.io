from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")

old_open = '''          <a class="link-card featured"\n            href="https://docs.google.com/forms/d/e/1FAIpQLSc7EzFal7b7QY3Oe-Ktlxi2w9dAYurej6I8yL24Yq8oU77cWg/viewform?usp=dialog"\n            target="_blank" rel="noopener noreferrer">'''
new_open = '''          <a class="link-card featured" href="./verify.html">'''

if old_open not in text:
    raise SystemExit("기존 Google Form 참여 신청 링크를 찾지 못했습니다. index.html이 변경되었는지 확인해주세요.")

text = text.replace(old_open, new_open, 1)

# 참여 신청 카드 안의 외부 링크 아이콘을 내부 페이지 이동 화살표로 변경합니다.
start = text.index('<!-- 참여 신청 -->')
end = text.index('<!-- 페이스북 그룹 -->', start)
section = text[start:end]
section = section.replace('<!-- 외부 링크 아이콘 -->', '<!-- 내부 페이지 이동 아이콘 -->', 1)
section = section.replace(
    'd="M14 4h6v6M20 4l-9 9M19 14v5H5V5h5"',
    'd="M5 12h14m-6-6 6 6-6 6"',
    1,
)
text = text[:start] + section + text[end:]

path.write_text(text, encoding="utf-8")
print("index.html: 참여 신청 링크를 ./verify.html 로 변경했습니다.")
