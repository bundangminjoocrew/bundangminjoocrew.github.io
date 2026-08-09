# 2026 더불어민주당 전당대회 데이터

> 이 파일만 수정하면 전당대회 페이지의 일정·득표수·득표율·가중치 계산이 갱신됩니다.  
> 아래 `json` 코드블록의 숫자와 일정만 수정하세요. **득표율은 직접 입력하지 않습니다.** 득표수로 자동 계산합니다.

## 입력 원칙

- `votes`에는 **실제 발표된 득표수**만 입력합니다.
- 아직 결과가 없으면 `null`을 유지합니다.
- `weight`가 `1.05`이면 해당 결과 단위의 득표수가 전체 누계에서 5% 가중됩니다.
- 당대표와 최고위원 결과가 서로 다른 단위로 발표된 경우 각각 별도 `resultUnits`를 만들 수 있습니다.
- `published`는 더불어민주당 공식 공지의 지역별 원자료를 합산한 **현재 누계 스냅샷**입니다.

```json
{
  "meta": {
    "pageTitle": "2026 전당대회",
    "eventName": "더불어민주당 제3차 정기전국당원대회",
    "description": "남은 권리당원 투표와 순회경선 합동연설회 일정, 당대표·최고위원 득표 현황을 한 화면에서 확인합니다. 지역별 득표수는 입력 즉시 자동으로 득표율과 가중치 누계에 반영됩니다.",
    "electionDate": "2026-08-17",
    "calendarStart": "2026-08-09",
    "calendarDays": 14,
    "updatedAt": "2026-08-09T02:33:00+09:00",
    "dataStatus": "8월 8일 결과 및 더불어민주당 공식 투표·순회경선 합동연설회 일정 반영"
  },
  "rules": {
    "partyVoteWeight": 0.7,
    "publicPollWeight": 0.3,
    "leaderMethod": "당대표 1순위 득표 기준 권리당원 투표결과 공개",
    "supremeMethod": "1인 2표",
    "defaultStrategicMultiplier": 1.05,
    "weightRuleNote": "전략지역 5% 가중치는 대구·경북·경남에만 적용합니다."
  },
  "candidates": {
    "leader": [
      {
        "id": "song-younggil",
        "number": 1,
        "name": "송영길",
        "short": "송영길",
        "image": "./assets/images/candidates/song-younggil.webp"
      },
      {
        "id": "jung-chungrae",
        "number": 2,
        "name": "정청래",
        "short": "정청래",
        "image": "./assets/images/candidates/jung-chungrae.webp"
      },
      {
        "id": "kim-minseok",
        "number": 3,
        "name": "김민석",
        "short": "김민석",
        "image": "./assets/images/candidates/kim-minseok.webp"
      }
    ],
    "supreme": [
      {
        "id": "choi-minhee",
        "number": 1,
        "name": "최민희",
        "short": "최민희",
        "image": "./assets/images/candidates/choi-minhee.webp"
      },
      {
        "id": "kim-yong",
        "number": 2,
        "name": "김용",
        "short": "김용",
        "image": "./assets/images/candidates/kim-yong.webp"
      },
      {
        "id": "kim-youngho",
        "number": 3,
        "name": "김영호",
        "short": "김영호",
        "image": "./assets/images/candidates/kim-youngho.webp"
      },
      {
        "id": "seo-mihwa",
        "number": 4,
        "name": "서미화",
        "short": "서미화",
        "image": "./assets/images/candidates/seo-mihwa.webp"
      },
      {
        "id": "han-minsoo",
        "number": 5,
        "name": "한민수",
        "short": "한민수",
        "image": "./assets/images/candidates/han-minsoo.webp"
      },
      {
        "id": "lee-sungyoon",
        "number": 6,
        "name": "이성윤",
        "short": "이성윤",
        "image": "./assets/images/candidates/lee-sungyoon.webp"
      },
      {
        "id": "park-sunwon",
        "number": 7,
        "name": "박선원",
        "short": "박선원",
        "image": "./assets/images/candidates/park-sunwon.webp"
      },
      {
        "id": "lim-miae",
        "number": 8,
        "name": "임미애",
        "short": "임미애",
        "image": "./assets/images/candidates/lim-miae.webp"
      }
    ]
  },
  "published": {
    "leader": {
      "label": "8월 8일 발표 누계",
      "note": "제주·인천 결과까지 지역별 원득표를 모두 합산한 누계. 현재 입력된 원득표 자동계산과 동일합니다.",
      "votes": {
        "song-younggil": 16955,
        "jung-chungrae": 75380,
        "kim-minseok": 76844
      }
    },
    "supreme": {
      "label": "8월 8일 발표 누계",
      "note": "제주·인천 결과까지 지역별 원득표를 모두 합산한 최고위원 누계. 현재 입력된 원득표 자동계산과 동일합니다.",
      "votes": {
        "choi-minhee": 71140,
        "kim-yong": 42770,
        "kim-youngho": 11126,
        "seo-mihwa": 47767,
        "han-minsoo": 48892,
        "lee-sungyoon": 39550,
        "park-sunwon": 56857,
        "lim-miae": 20256
      }
    }
  },
  "schedule": [
    {
      "date": "2026-08-09",
      "type": "regional",
      "title": "강원 순회경선 합동연설회",
      "shortTitle": "강원 합동연설회",
      "mobileNote": "10:00",
      "detail": "당대표 및 최고위원 후보자 선출을 위한 순회경선 합동연설회 · 10:00 · 횡성국민체육센터"
    },
    {
      "date": "2026-08-09",
      "type": "regional",
      "title": "대구·경북 순회경선 합동연설회",
      "shortTitle": "대구·경북 합동연설회",
      "mobileNote": "16:00",
      "detail": "당대표 및 최고위원 후보자 선출을 위한 순회경선 합동연설회 · 16:00 · 인터불고 엑스코 호텔 그랜드볼룸"
    },
    {
      "date": "2026-08-11",
      "endDate": "2026-08-12",
      "type": "vote",
      "phase": "online",
      "title": "전남·광주 권리당원 온라인투표",
      "shortTitle": "전남·광주 온라인투표",
      "mobileNote": "권리당원 온라인투표",
      "detail": "더불어민주당 공식 투표일정: 전남·광주 권리당원 온라인투표 8월 11일~12일"
    },
    {
      "date": "2026-08-11",
      "endDate": "2026-08-12",
      "type": "vote",
      "phase": "online",
      "title": "전북 권리당원 온라인투표",
      "shortTitle": "전북 온라인투표",
      "mobileNote": "권리당원 온라인투표",
      "detail": "더불어민주당 공식 투표일정: 전북 권리당원 온라인투표 8월 11일~12일"
    },
    {
      "date": "2026-08-13",
      "endDate": "2026-08-14",
      "type": "vote",
      "phase": "ars",
      "title": "전남·광주 권리당원 ARS투표",
      "shortTitle": "전남·광주 ARS투표",
      "mobileNote": "권리당원 ARS투표",
      "detail": "더불어민주당 공식 투표일정: 전남·광주 권리당원 ARS투표 8월 13일~14일"
    },
    {
      "date": "2026-08-13",
      "endDate": "2026-08-14",
      "type": "vote",
      "phase": "ars",
      "title": "전북 권리당원 ARS투표",
      "shortTitle": "전북 ARS투표",
      "mobileNote": "권리당원 ARS투표",
      "detail": "더불어민주당 공식 투표일정: 전북 권리당원 ARS투표 8월 13일~14일"
    },
    {
      "date": "2026-08-12",
      "endDate": "2026-08-13",
      "type": "vote",
      "phase": "online",
      "title": "경기 권리당원 온라인투표",
      "shortTitle": "경기 온라인투표",
      "mobileNote": "권리당원 온라인투표",
      "detail": "더불어민주당 공식 투표일정: 경기 권리당원 온라인투표 8월 12일~13일"
    },
    {
      "date": "2026-08-12",
      "endDate": "2026-08-13",
      "type": "vote",
      "phase": "online",
      "title": "서울 권리당원 온라인투표",
      "shortTitle": "서울 온라인투표",
      "mobileNote": "권리당원 온라인투표",
      "detail": "더불어민주당 공식 투표일정: 서울 권리당원 온라인투표 8월 12일~13일"
    },
    {
      "date": "2026-08-14",
      "endDate": "2026-08-15",
      "type": "vote",
      "phase": "ars",
      "title": "경기 권리당원 ARS투표",
      "shortTitle": "경기 ARS투표",
      "mobileNote": "권리당원 ARS투표",
      "detail": "더불어민주당 공식 투표일정: 경기 권리당원 ARS투표 8월 14일~15일"
    },
    {
      "date": "2026-08-14",
      "endDate": "2026-08-15",
      "type": "vote",
      "phase": "ars",
      "title": "서울 권리당원 ARS투표",
      "shortTitle": "서울 ARS투표",
      "mobileNote": "권리당원 ARS투표",
      "detail": "더불어민주당 공식 투표일정: 서울 권리당원 ARS투표 8월 14일~15일"
    },
    {
      "date": "2026-08-15",
      "type": "regional",
      "title": "전남광주 순회경선 합동연설회",
      "shortTitle": "전남광주 합동연설회",
      "mobileNote": "13:00",
      "detail": "당대표 및 최고위원 후보자 선출을 위한 순회경선 합동연설회 · 13:00 · 나주종합스포츠파크 다목적체육관"
    },
    {
      "date": "2026-08-15",
      "type": "regional",
      "title": "전북 순회경선 합동연설회",
      "shortTitle": "전북 합동연설회",
      "mobileNote": "17:00",
      "detail": "당대표 및 최고위원 후보자 선출을 위한 순회경선 합동연설회 · 17:00 · 원광대학교 문화체육관"
    },
    {
      "date": "2026-08-16",
      "type": "regional",
      "title": "경기 순회경선 합동연설회",
      "shortTitle": "경기 합동연설회",
      "mobileNote": "10:30",
      "detail": "당대표 및 최고위원 후보자 선출을 위한 순회경선 합동연설회 · 10:30 · 수원종합운동장 실내체육관"
    },
    {
      "date": "2026-08-16",
      "type": "regional",
      "title": "서울 순회경선 합동연설회",
      "shortTitle": "서울 합동연설회",
      "mobileNote": "16:00",
      "detail": "당대표 및 최고위원 후보자 선출을 위한 순회경선 합동연설회 · 16:00 · 킨텍스 제2전시관 9A홀"
    },
    {
      "date": "2026-08-17",
      "type": "final",
      "title": "제3차 정기전국당원대회",
      "shortTitle": "전국당원대회",
      "detail": "전국대의원 투표 및 국민여론조사를 포함한 최종 결과 발표"
    }
  ],
  "resultUnits": [
    {
      "id": "chungnam",
      "name": "충남",
      "date": "2026-08-01",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 3026,
        "jung-chungrae": 11835,
        "kim-minseok": 12484
      },
      "supremeVotes": {
        "choi-minhee": 12024,
        "kim-yong": 6806,
        "kim-youngho": 2113,
        "seo-mihwa": 7716,
        "han-minsoo": 7625,
        "lee-sungyoon": 5840,
        "park-sunwon": 9237,
        "lim-miae": 3329
      }
    },
    {
      "id": "chungbuk",
      "name": "충북",
      "date": "2026-08-01",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 2034,
        "jung-chungrae": 7919,
        "kim-minseok": 8967
      },
      "supremeVotes": {
        "choi-minhee": 8217,
        "kim-yong": 5065,
        "kim-youngho": 1490,
        "seo-mihwa": 5240,
        "han-minsoo": 5084,
        "lee-sungyoon": 3873,
        "park-sunwon": 6405,
        "lim-miae": 2466
      }
    },
    {
      "id": "daejeon",
      "name": "대전",
      "date": "2026-08-01",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 1538,
        "jung-chungrae": 8187,
        "kim-minseok": 7249
      },
      "supremeVotes": {
        "choi-minhee": 7854,
        "kim-yong": 4049,
        "kim-youngho": 1121,
        "seo-mihwa": 4427,
        "han-minsoo": 5028,
        "lee-sungyoon": 3970,
        "park-sunwon": 5556,
        "lim-miae": 1943
      }
    },
    {
      "id": "sejong",
      "name": "세종",
      "date": "2026-08-01",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 429,
        "jung-chungrae": 2388,
        "kim-minseok": 1932
      },
      "supremeVotes": {
        "choi-minhee": 2289,
        "kim-yong": 1125,
        "kim-youngho": 299,
        "seo-mihwa": 1134,
        "han-minsoo": 1485,
        "lee-sungyoon": 1155,
        "park-sunwon": 1523,
        "lim-miae": 488
      }
    },
    {
      "id": "ulsan",
      "name": "울산",
      "date": "2026-08-02",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 972,
        "jung-chungrae": 4054,
        "kim-minseok": 4337
      },
      "supremeVotes": {
        "choi-minhee": 4199,
        "kim-yong": 2309,
        "kim-youngho": 540,
        "seo-mihwa": 2694,
        "han-minsoo": 2680,
        "lee-sungyoon": 2069,
        "park-sunwon": 3205,
        "lim-miae": 1030
      }
    },
    {
      "id": "busan",
      "name": "부산",
      "date": "2026-08-02",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 1689,
        "jung-chungrae": 10345,
        "kim-minseok": 9182
      },
      "supremeVotes": {
        "choi-minhee": 9846,
        "kim-yong": 5254,
        "kim-youngho": 1009,
        "seo-mihwa": 6039,
        "han-minsoo": 6484,
        "lee-sungyoon": 5368,
        "park-sunwon": 6528,
        "lim-miae": 1904
      }
    },
    {
      "id": "gyeongnam",
      "name": "경남",
      "date": "2026-08-02",
      "status": "done",
      "weight": 1.05,
      "leaderVotes": {
        "song-younggil": 2468,
        "jung-chungrae": 10790,
        "kim-minseok": 10156
      },
      "supremeVotes": {
        "choi-minhee": 10651,
        "kim-yong": 5669,
        "kim-youngho": 1590,
        "seo-mihwa": 6228,
        "han-minsoo": 6896,
        "lee-sungyoon": 5379,
        "park-sunwon": 7584,
        "lim-miae": 2831
      },
      "memo": "전략지역 5% 가중치 적용"
    },
    {
      "id": "jeju",
      "name": "제주",
      "date": "2026-08-08",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 1240,
        "jung-chungrae": 6625,
        "kim-minseok": 8742
      },
      "supremeVotes": {
        "choi-minhee": 6080,
        "kim-yong": 4422,
        "kim-youngho": 1376,
        "seo-mihwa": 4781,
        "han-minsoo": 4680,
        "lee-sungyoon": 3696,
        "park-sunwon": 5125,
        "lim-miae": 3054
      }
    },
    {
      "id": "incheon",
      "name": "인천",
      "date": "2026-08-08",
      "status": "done",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 3559,
        "jung-chungrae": 13237,
        "kim-minseok": 13795
      },
      "supremeVotes": {
        "choi-minhee": 9980,
        "kim-yong": 8071,
        "kim-youngho": 1588,
        "seo-mihwa": 9508,
        "han-minsoo": 8930,
        "lee-sungyoon": 8200,
        "park-sunwon": 11694,
        "lim-miae": 3211
      }
    },
    {
      "id": "gangwon",
      "name": "강원",
      "date": "2026-08-09",
      "status": "scheduled",
      "weight": 1.0,
      "leaderVotes": {
        "song-younggil": 1467,
        "jung-chungrae": 7978,
        "kim-minseok": 9568
      },
      "supremeVotes": {
        "choi-minhee": 6760,
        "kim-yong": 5034,
        "kim-youngho": 1231,
        "seo-mihwa": 5740,
        "han-minsoo": 5218,
        "lee-sungyoon": 4472,
        "park-sunwon": 6790,
        "lim-miae": 2799
      }
    },
    {
      "id": "daegu",
      "name": "대구",
      "date": "2026-08-09",
      "status": "scheduled",
      "weight": 1.05,
      "leaderVotes": {
        "song-younggil": 561,
        "jung-chungrae": 4603,
        "kim-minseok": 4461
      },
      "supremeVotes": {
        "choi-minhee": 3263,
        "kim-yong": 2520,
        "kim-youngho": 347,
        "seo-mihwa": 2894,
        "han-minsoo": 2972,
        "lee-sungyoon": 2846,
        "park-sunwon": 2935,
        "lim-miae": 1473
      },
      "memo": "전략지역 5% 가중치 적용 예정"
    },
    {
      "id": "gyeongbuk",
      "name": "경북",
      "date": "2026-08-09",
      "status": "scheduled",
      "weight": 1.05,
      "leaderVotes": {
        "song-younggil": 723,
        "jung-chungrae": 4774,
        "kim-minseok": 4948
      },
      "supremeVotes": {
        "choi-minhee": 3303,
        "kim-yong": 2380,
        "kim-youngho": 360,
        "seo-mihwa": 2926,
        "han-minsoo": 2871,
        "lee-sungyoon": 2629,
        "park-sunwon": 3152,
        "lim-miae": 3269
      },
      "memo": "전략지역 5% 가중치 적용 예정"
    },
    {
      "id": "jeonnam-gwangju",
      "name": "전남광주",
      "date": "2026-08-15",
      "status": "scheduled",
      "weight": 1.0,
      "leaderVotes": null,
      "supremeVotes": null
    },
    {
      "id": "jeonbuk",
      "name": "전북",
      "date": "2026-08-15",
      "status": "scheduled",
      "weight": 1.0,
      "leaderVotes": null,
      "supremeVotes": null
    },
    {
      "id": "gyeonggi",
      "name": "경기",
      "date": "2026-08-16",
      "status": "scheduled",
      "weight": 1.0,
      "leaderVotes": null,
      "supremeVotes": null
    },
    {
      "id": "seoul",
      "name": "서울",
      "date": "2026-08-16",
      "status": "scheduled",
      "weight": 1.0,
      "leaderVotes": null,
      "supremeVotes": null
    }
  ],
  "sources": [
    {
      "label": "더불어민주당 공식 공지 · 충청권 투표 결과",
      "description": "충남·충북·대전·세종 당대표·최고위원 지역별 득표 원자료",
      "url": "https://theminjoo.kr/main/sub/news/view.php?sno=0&brd=1&post=1219524&search="
    },
    {
      "label": "더불어민주당 공식 공지 · 울산·부산·경남 투표 결과",
      "description": "울산·부산·경남 당대표·최고위원 지역별 득표 원자료",
      "url": "https://theminjoo.kr/main/sub/news/view.php?sno=0&brd=1&post=1219534&search="
    },
    {
      "label": "더불어민주당 공식 공지 · 제주·인천 투표 결과",
      "description": "제주·인천 당대표·최고위원 지역별 득표 원자료",
      "url": "https://theminjoo.kr/main/sub/news/view.php?sno=0&brd=1&post=1219599&search="
    },
    {
      "label": "더불어민주당 공식 공지 · 강원·대구·경북 투표 결과",
      "description": "강원·대구·경북 당대표·최고위원 지역별 득표 원자료",
      "url": "https://theminjoo.kr/main/sub/news/view.php?sno=0&brd=1&post=1219606&search="
    },
    {
      "label": "더불어민주당 공식 공지 · 지도부 선출 온라인투표율 공고",
      "description": "전남·광주·전북 및 경기·서울 권리당원 온라인투표 일정",
      "url": "https://theminjoo.kr/main/sub/news/view.php?brd=1&post=1219378&sno=0"
    },
    {
      "label": "더불어민주당 공식 공지 · 지도부 선출 투표 Q&A",
      "description": "호남권 및 서울·경기 권리당원 본경선 전체 투표기간",
      "url": "https://theminjoo.kr/main/sub/news/view.php?brd=1&post=1219367&sno=0"
    },
    {
      "label": "더불어민주당 공식 공지 · 순회경선 합동연설회 공고",
      "description": "강원·대구경북·전남광주·전북·경기·서울 합동연설회 일시와 장소",
      "url": "https://theminjoo.kr/main/sub/news/view.php?brd=1&post=1219420"
    }
  ]
}
```

## 빠른 업데이트 예시

대구 결과가 발표되면 `resultUnits`의 `daegu` 항목을 찾아 아래처럼 숫자만 넣으면 됩니다.

```json
"leaderVotes": {
  "kim-minseok": 12345,
  "jung-chungrae": 11234,
  "song-younggil": 2345
}
```

`weight: 1.05`이므로 원득표율과 별개로 **가중치 적용 전체 누계**가 자동으로 다시 계산됩니다. 대구·경북·경남은 `1.05`입니다.
