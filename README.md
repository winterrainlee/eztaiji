# eztaiji

태극권 동작의 원리를 이해하고 자세를 점검하기 위한 학습용 웹앱입니다.

[웹앱 열기](https://winterrainlee.github.io/eztaiji/)

상단의 단·자세를 누르면 단과 자세를 선택할 수 있습니다. ‘이 자세 시작’을 누르면 0동작인 시작 상태부터 봅니다. 좌표판은 고정되고 아래 설명만 스크롤합니다. 하단에는 현재 동작을 표시하며 이전·다음으로 이동합니다. 별도의 [소개 페이지](https://winterrainlee.github.io/eztaiji/about.html)에서 개요·구성·참고 자료를 확인합니다.

1단 預備式은 확인된 시작 자세와 2026-09-23 현장 지도에 근거한 1동작을 제공하고, 좌표는 학습용 근사로 표시합니다. 太極起勢 6동작도 발·허실·C의 평면 좌표를 학습용 도식으로 유지하며, 攬雀尾 21동작에 이어 單鞭 5동작·提手 3동작·右靠 3동작까지 권가 좌표와 해석을 제공합니다. 攬雀尾는 左掤 6동·右掤 5동·左履 2동·右擠 3동·雙按 5동의 묶음을 동작 제목에 표시합니다. 좌표판은 자세를 잡을 때 우선 보는 C 무게중심, 발 위치·허실·발끝 방향, 좌우 팔의 최종 구조 방향에 집중합니다. 팔 방향은 몸 기준 상대 방향을 저장하고 몸 방향 B와 합성해 빨간 화살표로 보여주며, B와 고관절·허리·어깨·팔꿈치의 연결 과정은 상세 데이터에 남깁니다. 발 좌표·중심·방향은 실측값이 아니라 학습용 근사입니다.

로컬에서는 index.html, about.html과 catalog.js를 같은 폴더에 두고 HTML을 브라우저에서 엽니다. GitHub Pages는 main 브랜치 루트 폴더를 사용합니다.

## 설계 문서

- [좌표계 원칙](docs/coordinate-system.md)
- [모바일 연습 화면](docs/mobile-layout.md)
- [단·자세·동작 구조와 출처](docs/routine-navigation.md)
- [확장 계획 및 체크리스트](docs/expansion-plan.md)
- [동작·상태 데이터 모델 0.1](docs/data-model.md)
- [데이터 모델 설계 시험](docs/design-tests/model-contract.test.mjs)
- [수련 원본의 검사·변환·배포 경로](docs/data-pipeline.md)
- [수련 원본·배포 데이터 정리 기록](docs/preparation-pair.md)

새 데이터 모델의 일부는 현재 배포 UI에 연결되어 있으며, 특히 攬雀尾 21동의 몸 기준 팔 방향과 C·발·팔 좌표판에 적용되어 있습니다. 가상 데이터의 기존 설계 시험은 `node docs/design-tests/model-contract.test.mjs`로 실행합니다. 실제 권가 내용이나 브라우저 화면을 모두 검증하는 시험은 아닙니다.

## 수련 원본과 배포 결과의 분리

목표는 `training/`에서 수련 내용을, `web/`에서 화면 코드를 편집하고, 검사·변환을 거친 `dist/`만 배포하는 것입니다. 데이터 모델은 수련 원본의 기준이며, 배포 데이터는 자동 생성하는 별도 읽기 형식입니다. `dist/`와 `.build/`는 Git에서 제외합니다.

초기에 옮겨 두었던 예비식 4동작 후보와 `legacy-preparation` 자료는 제거하고, 확인된 현장 메모만으로 새 1동작을 구성했습니다. 현재 `training/datasets/yijian.json`은 확인된 預備式 시작 자세와 太極起勢·攬雀尾·單鞭·提手·右靠 기록, 프로젝트 해석, 날짜별 수련 메모를 구분합니다. 같은 날의 현장 메모는 하나의 Source로 묶고 세부 주제는 locator로 구분합니다.

전체 사이트 빌드와 Actions 배포는 아직 구현하지 않았고 기존 루트 화면도 옮기지 않았습니다. `training/` 수정이 운영 사이트에 반영되는 단계는 아닙니다. 위의 현재 실행 방법은 그대로입니다. 목표 구조와 완료 조건은 [배포 경로 문서](docs/data-pipeline.md), 이번 범위와 한계는 [예비식 쌍 검증 기록](docs/preparation-pair.md)을 참고합니다.

## 수련 원본·배포 데이터의 로컬 검사

Node와 Python이 필요합니다. Python은 표준 스키마를 검사하는 개발용 도구이며 브라우저에는 포함하지 않습니다. 전체 운영용 빌드 명령은 별도 구현 예정입니다.

```sh
python -m pip install -r requirements-dev.txt
node --test tests/preparation-pair.test.mjs
python -m unittest discover -s tests -p 'test_preparation_schemas.py' -v
python scripts/check_preparation_pair.py --emit
```

이번 계약은 `preparation-pilot`입니다. 묶음·중간 상태·사건 선후·충돌 후보값 목록은 아직 지원하지 않으며 입력하면 오류로 알립니다. 데이터 검사 통과를 사부님 확인·원문 대조·브라우저 검증 완료로 보지 않습니다.
