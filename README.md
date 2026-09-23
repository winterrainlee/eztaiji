# eztaiji

태극권 동작의 원리를 이해하고 자세를 점검하기 위한 학습용 웹앱입니다.

[웹앱 열기](https://winterrainlee.github.io/eztaiji/)

상단의 단·자세를 누르면 단과 자세를 선택할 수 있습니다. ‘이 자세 시작’을 누르면 1동작부터 시작합니다. 좌표판은 고정되고 아래 설명만 스크롤합니다. 하단에는 현재 동작을 표시하며 이전·다음으로 이동합니다. 별도의 [소개 페이지](https://winterrainlee.github.io/eztaiji/about.html)에서 개요·구성·참고 자료를 확인합니다.

1단 預備式 4동작의 학습용 근사 도해와 설명을 제공합니다. 나머지 자세의 도해는 준비 중입니다. 발 좌표·중심·발끝 각도는 실측값이 아닙니다.

로컬에서는 index.html, about.html과 catalog.js를 같은 폴더에 두고 HTML을 브라우저에서 엽니다. GitHub Pages는 main 브랜치 루트 폴더를 사용합니다.

## 설계 문서

- [좌표계 원칙](docs/coordinate-system.md)
- [모바일 연습 화면](docs/mobile-layout.md)
- [단·자세·동작 구조와 출처](docs/routine-navigation.md)
- [확장 계획 및 체크리스트](docs/expansion-plan.md)
- [동작·상태 데이터 모델 0.1](docs/data-model.md)
- [데이터 모델 설계 시험](docs/design-tests/model-contract.test.mjs)

새 데이터 모델과 시작 상태 탐색은 설계 단계이며, 현재 배포 UI에 아직 적용하지 않았습니다. 가상 데이터의 설계 시험은 `node docs/design-tests/model-contract.test.mjs`로 실행합니다. 실제 권가 내용이나 브라우저 화면을 검증하는 시험은 아닙니다.
