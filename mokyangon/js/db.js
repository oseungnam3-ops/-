/**
 * MokyangOn LocalStorage Mock Database Engine
 */

const SEED_DATA = {
  users: [
    {
      id: "usr_admin",
      name: "김목사",
      phone: "010-1234-5678",
      email: "admin@mokyang.org",
      password: "1111",
      role: "admin",
      approval_status: "approved",
      created_at: "2026-01-01T09:00:00Z",
      last_login_at: ""
    },
    {
      id: "usr_leader",
      name: "박집사 (리더)",
      phone: "010-2222-3333",
      email: "leader@mokyang.org",
      password: "1111",
      role: "leader",
      approval_status: "approved",
      created_at: "2026-02-01T10:00:00Z",
      last_login_at: ""
    },
    {
      id: "usr_teacher",
      name: "이교사 (교사)",
      phone: "010-4444-5555",
      email: "teacher@mokyang.org",
      password: "1111",
      role: "teacher",
      approval_status: "approved",
      created_at: "2026-03-01T11:00:00Z",
      last_login_at: ""
    },
    {
      id: "usr_member",
      name: "홍길동 (성도)",
      phone: "010-8888-9999",
      email: "member@mokyang.org",
      password: "1111",
      role: "member",
      approval_status: "approved",
      created_at: "2026-04-01T12:00:00Z",
      last_login_at: ""
    },
    {
      id: "usr_pending",
      name: "가입대기자",
      phone: "010-0000-0000",
      email: "pending@mokyang.org",
      password: "1111",
      role: "member",
      approval_status: "pending",
      created_at: "2026-06-20T15:00:00Z",
      last_login_at: ""
    }
  ],
  small_groups: [
    {
      id: "grp_1",
      title: "온유 목장",
      category: "목장",
      description: "온유하고 겸손한 마음으로 삶을 나누는 목양 가족 모임입니다.",
      leader_id: "usr_leader",
      day_of_week: "금요일",
      time: "20:00",
      location: "리더 자택 및 로비 1층",
      target: "장년 부부 및 직장인",
      capacity: 10,
      is_active: true,
      created_at: "2026-03-10T10:00:00Z"
    },
    {
      id: "grp_2",
      title: "디모데 청년모임",
      category: "청년모임",
      description: "청년들의 열정과 비전을 나누고 말씀으로 일어서는 청년부 소그룹입니다.",
      leader_id: "usr_leader",
      day_of_week: "토요일",
      time: "17:00",
      location: "청년부실 (비전관 2층)",
      target: "20-30대 대학생 및 청년",
      capacity: 15,
      is_active: true,
      created_at: "2026-03-11T10:00:00Z"
    },
    {
      id: "grp_3",
      title: "목양 FC 축구모임",
      category: "축구모임",
      description: "축구를 통해 친목을 다지고 신앙 안에서 땀을 흘리는 건강한 운동 소모임입니다.",
      leader_id: "usr_leader",
      day_of_week: "토요일",
      time: "07:00",
      location: "교회 인근 풋살장",
      target: "축구를 사랑하는 모든 성도 및 이웃",
      capacity: 20,
      is_active: true,
      created_at: "2026-03-12T10:00:00Z"
    },
    {
      id: "grp_4",
      title: "중보기도 모임",
      category: "기도모임",
      description: "교회와 나라, 이웃 그리고 아픈 지체들을 위해 무릎 꿇는 기도 소모임입니다.",
      leader_id: "usr_leader",
      day_of_week: "수요일",
      time: "10:30",
      location: "본당 1층 소예배실",
      target: "기도의 동역자를 원하는 모든 분",
      capacity: 12,
      is_active: true,
      created_at: "2026-03-13T10:00:00Z"
    },
    {
      id: "grp_5",
      title: "새가족 모임 (31기)",
      category: "새가족모임",
      description: "파주목양교회에 처음 등록한 성도님들의 원활한 정착을 돕는 필수 기초 모임입니다.",
      leader_id: "usr_leader",
      day_of_week: "주일",
      time: "13:00",
      location: "새가족실",
      target: "신규 등록 성도 전체",
      capacity: 8,
      is_active: true,
      created_at: "2026-03-14T10:00:00Z"
    }
  ],
  small_group_members: [
    {
      id: "sgm_1",
      group_id: "grp_1",
      user_id: "usr_leader",
      status: "approved",
      joined_at: "2026-03-10T10:00:00Z"
    },
    {
      id: "sgm_2",
      group_id: "grp_1",
      user_id: "usr_member",
      status: "approved",
      joined_at: "2026-04-02T12:00:00Z"
    }
  ],
  small_group_attendance: [
    {
      id: "sga_1",
      group_id: "grp_1",
      user_id: "usr_member",
      meeting_date: "2026-06-19",
      status: "present",
      memo: "정시 참석 및 활발한 나눔"
    },
    {
      id: "sga_2",
      group_id: "grp_1",
      user_id: "usr_member",
      meeting_date: "2026-06-12",
      status: "present",
      memo: ""
    }
  ],
  small_group_posts: [
    {
      id: "sgp_1",
      group_id: "grp_1",
      title: "이번 주 금요일 목장 모임 장소 안내",
      content: "이번 주는 박집사 가정에서 모입니다. 맛있는 과일과 차를 준비해 둘 테니 저녁 8시까지 편안한 복장으로 와주세요!",
      post_type: "notice",
      author_id: "usr_leader",
      created_at: "2026-06-22T10:00:00Z"
    },
    {
      id: "sgp_2",
      group_id: "grp_1",
      title: "어머님 건강을 위한 중보기도 부탁드립니다.",
      content: "저희 어머니께서 다음 주에 무릎 수술을 받으십니다. 수술이 잘 진행되고 회복되실 수 있도록 목원 분들의 기도 부탁드립니다.",
      post_type: "prayer",
      author_id: "usr_member",
      created_at: "2026-06-23T08:00:00Z"
    },
    {
      id: "sgp_3",
      group_id: "grp_1",
      title: "지난 모임 너무 은혜로웠습니다.",
      content: "가정 예배 드리고 삶을 나눌 때 마음에 큰 위로가 되었습니다. 목원 여러분 늘 감사합니다.",
      post_type: "review",
      author_id: "usr_member",
      created_at: "2026-06-20T11:00:00Z"
    }
  ],
  devotions: [
    {
      id: "dev_1",
      date: "2026-06-24",
      title: "선한 목자이신 예수님",
      bible_text: "요한복음 10:11-15",
      scripture: "11 나는 선한 목자라 선한 목자는 양들을 위하여 목숨을 버리거니와\n12 삯꾼은 목자가 아니요 양도 제 양이 아니라 이리가 오는 것을 보면 양을 버리고 달아나나니 이리가 양을 물어 가고 또 헤치느니라\n13 달아나는 것은 그가 삯꾼인 까닭에 양을 돌보지 아니함이나\n14 나는 선한 목자라 나는 내 양을 알고 양도 나를 아는 것이\n15 아버지께서 나를 아시고 내가 아버지를 아는 것 같으니 나는 양을 위하여 목숨을 버리노라",
      explanation: "예수님께서는 스스로를 '선한 목자'라고 말씀하십니다. 선한 목자는 양의 이름을 알고, 양의 형편을 알며, 양을 보호하기 위해 기꺼이 목숨을 내던지는 사랑의 목자입니다. 삯꾼은 위기가 찾아오면 양을 버리고 도망치지만, 예수님은 우리를 결코 버려두지 않으십니다. 그분은 우리를 위해 십자가에서 목숨을 내어 주심으로 진짜 목자이심을 몸소 증명하셨습니다.",
      meditation_question: "나를 끝까지 책임지시고 보호하시는 선한 목자 예수님을 진정 신뢰하며 따르고 있나요?",
      application_question: "오늘 하루, 내 고집대로 행동하기보다 목자의 음성(말씀)에 귀 기울이며 순종해야 할 구체적인 한 가지는 무엇입니까?",
      prayer: "우리의 참 목자이신 주님, 때로 세상의 삯꾼과 소음에 눈이 멀어 주님의 음성을 놓치고 방황했던 것을 회개합니다. 나를 위해 목숨까지 버리신 주님의 사랑을 신뢰하게 하시고, 오늘 하루 주님의 발자취만을 묵묵히 따라가며 평안을 누리게 하옵소서. 예수님의 이름으로 기도합니다. 아멘.",
      created_at: "2026-06-24T00:00:00Z"
    },
    {
      id: "dev_2",
      date: "2026-06-23",
      title: "폭풍 속에서도 누리는 평안",
      bible_text: "마가복음 4:35-41",
      scripture: "35 그 날 저물 때에 제자들에게 이르시되 우리가 저편으로 건너가자 하시니\n36 그들이 무리를 떠나 예수를 배에 계신 그대로 모시고 가매 다른 배들도 함께 하더니\n37 큰 광풍이 일어나며 물결이 배에 부딪쳐 들어와 배에 가득하게 되었더라\n38 예수께서는 고물에서 베개를 베고 주무시더니 제자들이 깨우며 이르되 선생님이여 우리가 죽게 된 것을 돌보지 아니하시나이까 하니\n39 예수께서 깨어 바람을 꾸짖으시며 바다더러 이르시되 잠잠하라 고요하라 하시니 바람이 그치고 아주 잔잔하여지더라\n40 이에 제자들에게 이르시되 어찌하여 이렇게 무서워하느냐 너희가 어찌 믿음이 없느냐 하시니\n41 그들이 심히 두려워하여 서로 말하되 그가 누구이기에 바람과 바다도 순종하는가 하였더라",
      explanation: "인생의 바다에는 예기치 못한 광풍이 불어옵니다. 노련한 어부였던 제자들도 제어할 수 없는 거친 풍랑 앞에서 죽음의 두려움을 느꼈습니다. 그러나 그들의 배에는 온 우주의 주권자이신 예수님이 함께 타고 계셨습니다. 주님이 주무신다고 해서 우리를 방치하시는 것이 아닙니다. 광풍보다 크신 예수님을 바라볼 때, 우리는 비로소 환경을 초월하는 참된 평안을 가질 수 있습니다.",
      meditation_question: "현재 내 삶의 영역에서 주님이 계시지 않은 것처럼 불안해하고 두려워하는 '광풍'은 무엇입니까?",
      application_question: "내 능력으로 폭풍을 잠재우려 애쓰기보다, 주님을 깨우며 기도로 전적으로 맡기는 믿음의 행동을 시작해 봅시다.",
      prayer: "바람과 바다를 말씀 한마디로 잔잔케 하시는 전능자 주님, 제 마음의 두려움과 불신을 용서하소서. 내 인생의 배에 주님이 함께 계심을 기억하고, 거친 폭풍 가운데서도 평안히 누워 계셨던 예수님의 평안을 저도 소유하게 하소서. 예수님의 이름으로 기도합니다. 아멘.",
      created_at: "2026-06-23T00:00:00Z"
    },
    {
      id: "dev_3",
      date: "2026-06-22",
      title: "빛으로 오신 주님과 동행하기",
      bible_text: "요한일서 1:5-7",
      scripture: "5 우리가 그에게서 듣고 너희에게 전하는 소식은 이것이니 곧 하나님은 빛이시라 그에게는 어둠이 조금도 없으시다는 것이니라\n6 만일 우리가 하나님과 사귐이 있다 하고 어둠에 행하면 거짓말을 하고 진리를 행하지 아니함이거니와\n7 그가 빛 가운데 계신 것 같이 우리도 빛 가운데 행하면 우리가 서로 사귐이 있고 그 아들 예수의 피가 우리를 모든 죄에서 깨끗하게 하실 것이요",
      explanation: "하나님은 어둠이 전혀 없으신 거룩한 빛이십니다. 따라서 빛이신 주님과 진실한 친밀함을 나누는 성도는 어둠의 일들(죄와 위선, 거짓말)을 미워하고 떠나야 합니다. 우리가 빛 아래로 나와 우리의 모자람을 인정하고 정직하게 행할 때, 비로소 성도 간의 진정한 코이노니아가 싹트고 예수의 보혈이 우리의 허물을 덮어 씻어줍니다.",
      meditation_question: "하나님과 동행한다고 말하면서, 아직 은밀한 어둠 속에 감추어 두고 있는 삶의 조각이 있지는 않습니까?",
      application_question: "오늘 하루, 대인 관계나 일상의 선택 속에서 '어둠의 편법' 대신 '빛의 정직함'을 실천할 방법은 무엇인가요?",
      prayer: "어둠을 물리치시고 참 생명을 주시는 주님, 제 영혼의 은밀한 죄와 허물을 주님의 빛 앞으로 다 가지고 나아옵니다. 주님의 보혈로 깨끗하게 하시고, 거짓된 삶에서 돌이켜 매일 빛 가운데 걷게 하소서. 정직하고 은혜로운 만남을 복되게 이끌어 주옵소서. 예수님의 이름으로 기도합니다. 아멘.",
      created_at: "2026-06-22T00:00:00Z"
    }
  ],
  devotion_responses: [
    {
      id: "dvr_1",
      devotion_id: "dev_1",
      user_id: "usr_member",
      grace_note: "선한 목자이신 예수님이 계셔서 참 든든합니다. 삯꾼 같은 세상 환경에 속지 않겠습니다.",
      application_note: "직장에서 다른 사람들의 칭찬이나 평가에 일희일비하기보다 주님의 시선에 더 감사하기",
      prayer_request: "선한 목자의 음성만을 명확히 구별하게 해 주세요.",
      visibility: "share", // 나만보기(private), 리더만(leader), 소모임 공유(share)
      created_at: "2026-06-24T08:30:00Z"
    }
  ],
  courses: [
    {
      id: "crs_1",
      title: "새가족반",
      description: "파주목양교회의 기쁨이 되는 가족으로서 교회 비전을 공유하고 기독교 신앙의 첫걸음을 떼는 필수 수강 과정입니다.",
      teacher_id: "usr_teacher",
      total_lessons: 4,
      is_active: true,
      created_at: "2026-03-01T09:00:00Z"
    },
    {
      id: "crs_2",
      title: "기초성경공부",
      description: "성경의 핵심 뼈대인 창조, 타락, 구속의 구속사를 역사적 관점에서 이해하고 체계적으로 배우는 입문 강좌입니다.",
      teacher_id: "usr_teacher",
      total_lessons: 1,
      is_active: true,
      created_at: "2026-03-05T09:00:00Z"
    },
    {
      id: "crs_3",
      title: "복음이란 무엇인가",
      description: "십자가의 도에 담긴 전능하신 하나님의 지혜와 구원의 능력을 분명하게 깨달아 거듭난 그리스도인으로 세워집니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-10T09:00:00Z"
    },
    {
      id: "crs_4",
      title: "하나님 나라 성경공부",
      description: "내 중심적인 신앙에서 벗어나, 이 땅에 임한 하나님의 통치와 그 나라의 백성으로서의 주권적 신앙을 배웁니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-12T09:00:00Z"
    },
    {
      id: "crs_5",
      title: "제자훈련",
      description: "예수 그리스도를 닮아가는 인격적 훈련과 제자 공동체의 깊은 헌신을 익히는 정예 소그룹 제자 양성 과정입니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-15T09:00:00Z"
    },
    {
      id: "crs_6",
      title: "사역자 리더훈련",
      description: "소그룹(목장)의 동역자로서 다른 영혼들을 돌보고 목양하는 데 필요한 리더십과 실천적 돌봄 기법을 배웁니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-18T09:00:00Z"
    },
    {
      id: "crs_7",
      title: "QT 말씀 묵상 학교",
      description: "매일 스스로 하나님의 말씀을 깊이 읽고 묵상하며 적용하는 큐티의 실제를 체계적으로 훈련하는 실천 과정입니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-20T09:00:00Z"
    },
    {
      id: "crs_8",
      title: "성경 맥잡기 (신구약 관통)",
      description: "창세기부터 요한계시록까지 성경 전체 역사 지형과 구속사적 맥락을 단숨에 관통하여 성경을 읽어지게 합니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-22T09:00:00Z"
    },
    {
      id: "crs_9",
      title: "크리스천 부모 학교",
      description: "하나님이 맡기신 자녀를 성경적 말씀 훈육과 따뜻한 사랑으로 양육하는 지혜를 나누는 가정 영성 빌드업 과정입니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-25T09:00:00Z"
    },
    {
      id: "crs_10",
      title: "중보기도 훈련 학교",
      description: "기도의 파수꾼으로서 나와 공동체, 나라와 열방을 향해 쉬지 않고 무릎 꿇는 기도의 용사들을 키우는 영적 전투반입니다.",
      teacher_id: "usr_teacher",
      total_lessons: 0,
      is_active: true,
      created_at: "2026-03-28T09:00:00Z"
    }
  ],
  lessons: [
    {
      id: "les_1_1",
      course_id: "crs_1",
      title: "1강. 교회와의 첫 만남과 목양 비전",
      video_url: "https://www.youtube.com/embed/n4fCqC96dY0", // 예시 유튜브
      lesson_note: "파주목양교회는 '성도는 쉽게 참여하고, 리더는 쉽게 돌보고, 교회는 한눈에 목양하는 따뜻한 디지털 양육 플랫폼'을 지향합니다. 목양온은 이러한 공동체의 따뜻한 결속을 이어주는 가교입니다. 담임 목사님의 따뜻한 환영 메시지와 우리 교회가 가야 할 목양 중심의 제자 공동체 비전을 알아봅니다.",
      summary: "파주목양교회 환영 영상 시청 및 교회 공동체의 비전과 핵심 가치(영성, 소모임, 돌봄) 이해.",
      bible_text: "에베소서 2:19-22",
      discussion_questions: "1. 우리 교회의 '목양' 비전 중 가장 기대되거나 공감되는 부분은 무엇인가요?\n2. 당신에게 교회 공동체는 어떤 의미입니까?",
      assignment_text: "교회 소개 영상을 보고 파주목양교회의 4대 핵심 사역(예배, 양육, 소그룹, 선교)을 요약하여 적어 제출해 주세요.",
      order_number: 1
    },
    {
      id: "les_1_2",
      course_id: "crs_1",
      title: "2강. 구원이란 무엇인가? (구원의 확신)",
      video_url: "https://www.youtube.com/embed/tS4J85g2aQ4",
      lesson_note: "구원은 행위가 아니라 오직 하나님의 은혜에 의해, 예수 그리스도를 믿음으로 주어지는 선물입니다. 우리는 구원의 확신을 어떻게 지켜갈 수 있을까요? 요한일서 말씀을 기반으로 구원의 흔들리지 않는 5가지 약속에 대해 정리합니다.",
      summary: "믿음과 은혜로 말미암는 구원의 도리와 내적 확신 5단계 학습.",
      bible_text: "요한일서 5:11-13",
      discussion_questions: "1. 구원을 나의 공로나 기분으로 흔들지 않고 약속의 말씀에 고정하고 계십니까?\n2. 내가 하나님의 자녀 됨을 어떻게 확신할 수 있나요?",
      assignment_text: "요한일서 5장 11절부터 13절을 친필로 노트에 적어 사진을 찍어 올리거나 텍스트로 적어 제출하십시오.",
      order_number: 2
    },
    {
      id: "les_1_3",
      course_id: "crs_1",
      title: "3강. 예배와 기도 생활 (신앙의 기둥)",
      video_url: "https://www.youtube.com/embed/FwT9FfX1oE0",
      lesson_note: "그리스도인의 성장은 매일의 말씀 묵상과 쉬지 않는 기도를 양식 삼아 자라납니다. 영과 진리로 드리는 참된 예배의 태도와, 주님이 가르쳐 주신 주기도문을 통해 구체적인 기도 작성을 실천해봅니다.",
      summary: "영과 진리로 드리는 주일 예배 태도와 말씀/기도의 습관 다지기.",
      bible_text: "요한복음 4:23-24",
      discussion_questions: "1. 현재 나의 예배 생활 및 말씀 읽기, 기도의 현주소는 어떠한가요?\n2. 기도가 왜 '영혼의 호흡'인지 이야기해봅시다.",
      assignment_text: "이번 주 나만의 매일 말씀 묵상(QT) 시간을 정하고, 이를 서약서 형태로 적어 제출하세요 (예: 매일 아침 7시 거실에서).",
      order_number: 3
    },
    {
      id: "les_1_4",
      course_id: "crs_1",
      title: "4강. 소그룹 공동체와 봉사의 기쁨",
      video_url: "https://www.youtube.com/embed/6cR_k34_eXk",
      lesson_note: "교회는 건물이나 조직이 아닙니다. 예수 그리스도를 머리로 한 지체들의 유기적 모임입니다. 우리 교회 소모임(목장, 순모임, 봉사팀)에 가입하고 활동하며 서로를 세우고 하나님 나라를 넓히는 협력의 즐거움을 배웁니다.",
      summary: "교회의 지체 의식과 소모임(목장) 네트워크 및 은사별 봉사 영역 소개.",
      bible_text: "고린도전서 12:12-27",
      discussion_questions: "1. 나에게 숨겨진 혹은 사용하고 싶은 하나님의 은사(기획, 찬양, 봉사, 가르침 등)는 무엇입니까?\n2. 소그룹에 정기적으로 참여할 때 얻을 수 있는 유익은 무엇일까요?",
      assignment_text: "이 강좌를 마무리하며 소모임 목록에서 관심 있는 소그룹(예: 온유 목장, 중보기도)을 선택하고, 신청하고 싶은 사유를 한 문장으로 적어 과제로 제출하세요.",
      order_number: 4
    },
    {
      id: "les_2_1",
      course_id: "crs_2",
      title: "1강. 성경의 기원과 신구약의 역사",
      video_url: "https://www.youtube.com/embed/n4fCqC96dY0",
      lesson_note: "성경은 하나님의 감동으로 기록된 절대 무오한 생명의 말씀입니다. 신구약 66권이 쓰여지기까지의 영사적 배경과 정경화 과정, 큰 흐름을 잡는 맥잡기 강의입니다.",
      summary: "성경 66권 정경 역사와 문학적 장르 분류 기초 교육.",
      bible_text: "디모데후서 3:16-17",
      discussion_questions: "1. 성경은 하나님의 감동으로 되었다는 것이 왜 신앙의 가장 핵심 토대일까요?",
      assignment_text: "구약 39권과 신약 27권의 이름과 순서를 외우고, 신약 4복음서의 이름을 적어 제출하십시오.",
      order_number: 1
    }
  ],
  course_enrollments: [
    {
      id: "cen_1",
      course_id: "crs_1",
      user_id: "usr_member",
      status: "enrolled", // enrolled, completed
      progress_rate: 50, // 2/4 완료 상태
      enrolled_at: "2026-06-10T10:00:00Z"
    }
  ],
  lesson_progress: [
    {
      id: "lpr_1",
      lesson_id: "les_1_1",
      user_id: "usr_member",
      is_completed: true,
      completed_at: "2026-06-11T15:00:00Z"
    },
    {
      id: "lpr_2",
      lesson_id: "les_1_2",
      user_id: "usr_member",
      is_completed: true,
      completed_at: "2026-06-12T16:00:00Z"
    }
  ],
  submissions: [
    {
      id: "sub_1",
      lesson_id: "les_1_1",
      user_id: "usr_member",
      content: "파주목양교회의 4대 핵심 사역은 예배, 양육, 소그룹, 선교입니다. 성도 개인이 영적으로 바로 서며 동시에 목원들을 세우는 사역이 감명 깊습니다.",
      file_url: "",
      feedback: "훌륭한 과제 제출입니다! 핵심을 명확하게 짚어 주셨습니다. 앞으로의 배움도 응원합니다.",
      submitted_at: "2026-06-11T14:50:00Z"
    },
    {
      id: "sub_2",
      lesson_id: "les_1_2",
      user_id: "usr_member",
      content: "요한일서 5장 11-13절 필사: 또 증거는 이것이니 하나님이 우리에게 영생을 주신 것과 이 생명이 그의 아들 안에 있는 그것이니라 아들이 있는 자에게는 생명이 있고 하나님의 아들이 없는 자에게는 생명이 없느니라 내가 하나님의 아들의 이름을 믿는 너희에게 이것을 쓰는 것은 너희로 하여금 너희에게 영생이 있음을 알게 하려 하심이라.",
      file_url: "",
      feedback: "",
      submitted_at: "2026-06-12T15:45:00Z"
    }
  ],
  sermon_videos: [
    {
      id: "ser_1",
      title: "선한 목자의 인도하심을 따라",
      preacher: "김목사 (담임목사)",
      bible_text: "요한복음 10:1-18",
      sermon_date: "2026-06-21",
      youtube_url: "https://www.youtube.com/embed/n4fCqC96dY0",
      summary: "담임목사님의 요한복음 설교입니다. 현대 사회의 수많은 유혹과 거짓 목자들의 소리 속에서 오직 우리 구원자 되시며 모든 것 되시는 예수님의 음성에 귀를 기울이고 그분의 인도하심을 잠잠히 따라가며 영적 부흥과 평안을 회복해야 할 때입니다.",
      application_questions: "1. 요즘 주님의 목소리보다 내 생각과 판단을 더 앞세운 영역이 있다면 고백해 봅시다.\n2. 매일 하나님의 세미한 말씀을 묵상하는 시간을 어떻게 구체적으로 확보하겠습니까?",
      created_at: "2026-06-21T12:00:00Z"
    },
    {
      id: "ser_2",
      title: "굳건한 반석 위에 세운 신앙",
      preacher: "김목사 (담임목사)",
      bible_text: "마태복음 7:24-27",
      sermon_date: "2026-06-14",
      youtube_url: "https://www.youtube.com/embed/tS4J85g2aQ4",
      summary: "모래 위에 성을 쌓는 어리석은 신앙에서 벗어나, 고난과 시련의 바람이 불어와도 결코 흔들리지 않는 말씀의 반석 위에 믿음의 성채를 쌓는 법에 관한 설교입니다. 말씀을 듣고 지키며 삶으로 살아내는 실천을 역설합니다.",
      application_questions: "1. 나는 설교를 '듣는 것'만으로 신앙의 임무를 다했다고 착각하지는 않았나요?\n2. 폭풍이 올 때 흔들리는 나의 모래성은 무엇이며, 이를 보강하기 위한 말씀 순종의 첫 단추는 무엇인지 적어 보십시오.",
      created_at: "2026-06-14T12:00:00Z"
    },
    {
      id: "ser_3",
      title: "사랑 안에서 연합하는 공동체",
      preacher: "이목사 (협동목사)",
      bible_text: "에베소서 4:1-16",
      sermon_date: "2026-06-07",
      youtube_url: "https://www.youtube.com/embed/FwT9FfX1oE0",
      summary: "그리스도의 장성한 분량에 이르기까지 우리가 어떻게 소모임과 성경 공부, 봉사 사역을 통해 지체 간에 단단한 매듭으로 묶여 사랑으로 자라날 수 있는가를 선포합니다. 공동체를 향한 서로의 배려와 사랑의 수고를 강조합니다.",
      application_questions: "1. 소모임의 다른 지체들이 연약할 때 나는 사랑의 비판을 하기보다 기도의 무릎을 꿇고 있나요?\n2. 공동체의 연합을 해치는 나의 조급함과 말실수를 어떻게 다스릴 수 있을지 적용해 봅시다.",
      created_at: "2026-06-07T12:00:00Z"
    }
  ],
  notices: [
    {
      id: "not_1",
      title: "[전체] 2026년 하반기 양육 과정 및 성경 공부 개강 안내",
      content: "파주목양교회 영적 대도약을 위한 2026년 하반기 양육 훈련이 개설되었습니다. 이번 과정은 새가족반, 기초성경공부, 복음이란 무엇인가 등 3가지 온라인 집중 강좌와 다양한 오프라인 양육으로 개설되오니 성도님들의 많은 신청 바랍니다.\n- 개강일: 7월 첫째 주 일요일\n- 신청 방법: 목양온 앱 -> '양육' 탭 -> 각 과목 상세 -> 수강하기 신청\n- 문의: 이교사 (010-4444-5555)",
      target_role: "all",
      created_by: "usr_admin",
      created_at: "2026-06-22T09:00:00Z"
    },
    {
      id: "not_2",
      title: "[리더/교사] 목자 및 교사 일일 집중 세미나 공지",
      content: "각 소그룹 리더(목자)님들과 양육 담당 교사님들을 위한 핵심 세미나가 열립니다. 이번 세미나는 소그룹 돌봄과 온라인 피드백 작성에 필요한 팁을 전수하오니 필히 참석 바랍니다.\n- 일시: 6월 27일(토) 오후 2시 - 5시\n- 장소: 드림홀 (본관 지하 1층)\n- 준비물: 성경책, 필기도구",
      target_role: "leader_teacher",
      created_by: "usr_admin",
      created_at: "2026-06-23T11:00:00Z"
    }
  ],
  notifications: [
    {
      id: "ntf_1",
      user_id: "usr_member",
      title: "가입 승인 완료",
      message: "파주목양교회 목양온 앱 가입이 승인되었습니다. 환영합니다!",
      is_read: true,
      created_at: "2026-06-10T10:05:00Z"
    },
    {
      id: "ntf_2",
      user_id: "usr_member",
      title: "소모임 가입 승인",
      message: "[온유 목장] 소그룹 신청이 리더로부터 승인 완료되었습니다.",
      is_read: false,
      created_at: "2026-06-11T09:00:00Z"
    },
    {
      id: "ntf_3",
      user_id: "usr_member",
      title: "새 말씀묵상 등록",
      message: "6월 24일 '선한 목자이신 예수님' 말씀 묵상지가 등록되었습니다. 묵상을 채워보세요!",
      is_read: false,
      created_at: "2026-06-24T06:00:00Z"
    }
  ],
  church_schedules: [
    {
      id: "sch_1",
      date: "2026-06-24",
      time: "10:30",
      title: "중보기도 모임",
      description: "소예배실 1층",
      type: "prayer",
      created_at: "2026-06-24T10:30:00Z"
    },
    {
      id: "sch_2",
      date: "2026-06-24",
      time: "19:30",
      title: "하반기 양육 개설 회의",
      description: "당회실",
      type: "worship",
      created_at: "2026-06-24T19:30:00Z"
    },
    {
      id: "sch_3",
      date: "2026-06-26",
      time: "20:00",
      title: "금요 성령 기도회",
      description: "본당",
      type: "prayer",
      created_at: "2026-06-26T20:00:00Z"
    },
    {
      id: "sch_4",
      date: "2026-06-27",
      time: "14:00",
      title: "목자 및 교사 일일 집중 세미나",
      description: "드림홀 (본관 지하 1층)",
      type: "festival",
      created_at: "2026-06-27T14:00:00Z"
    },
    {
      id: "sch_5",
      date: "2026-06-28",
      time: "11:00",
      title: "주일 2부 대예배",
      description: "본당 대예배실",
      type: "worship",
      created_at: "2026-06-28T11:00:00Z"
    },
    {
      id: "sch_6",
      date: "2026-06-28",
      time: "13:00",
      title: "새가족 수료식",
      description: "새가족실",
      type: "education",
      created_at: "2026-06-28T13:00:00Z"
    }
  ]
};

const DB = {
  get(table) {
    const data = localStorage.getItem(`mokyang_${table}`);
    if (!data) {
      this.set(table, SEED_DATA[table] || []);
      return SEED_DATA[table] || [];
    }
    return JSON.parse(data);
  },

  set(table, data) {
    localStorage.setItem(`mokyang_${table}`, JSON.stringify(data));
  },

  insert(table, row) {
    const data = this.get(table);
    // ID generation
    if (!row.id) {
      const prefix = table.slice(0, 3).toLowerCase();
      row.id = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    row.created_at = new Date().toISOString();
    data.push(row);
    this.set(table, data);
    return row;
  },

  update(table, id, updatedRow) {
    const data = this.get(table);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updatedRow };
      this.set(table, data);
      return data[index];
    }
    return null;
  },

  delete(table, id) {
    if (table === "users") {
      const users = this.get("users");
      const filteredUsers = users.filter(u => u.id !== id);
      this.set("users", filteredUsers);

      // Cascade deletes in related tables
      const sgm = this.get("small_group_members");
      this.set("small_group_members", sgm.filter(m => m.user_id !== id));

      const sga = this.get("small_group_attendance");
      this.set("small_group_attendance", sga.filter(a => a.user_id !== id));

      const dvr = this.get("devotion_responses");
      this.set("devotion_responses", dvr.filter(r => r.user_id !== id));

      const cen = this.get("course_enrollments");
      this.set("course_enrollments", cen.filter(e => e.user_id !== id));

      const lpr = this.get("lesson_progress");
      this.set("lesson_progress", lpr.filter(p => p.user_id !== id));

      const sub = this.get("submissions");
      this.set("submissions", sub.filter(s => s.user_id !== id));

      const ntf = this.get("notifications");
      this.set("notifications", ntf.filter(n => n.user_id !== id));

      // Handle if leader is deleted - assign another admin as fallback
      const otherAdmin = users.find(u => u.role === "admin" && u.id !== id) || { id: "system" };

      const smallGroups = this.get("small_groups");
      smallGroups.forEach(g => {
        if (g.leader_id === id) {
          this.update("small_groups", g.id, { leader_id: otherAdmin.id });
        }
      });

      // Handle if teacher is deleted
      const courses = this.get("courses");
      courses.forEach(c => {
        if (c.teacher_id === id) {
          this.update("courses", c.id, { teacher_id: otherAdmin.id });
        }
      });
    } else if (table === "courses") {
      const courses = this.get("courses");
      this.set("courses", courses.filter(c => c.id !== id));

      const lessons = this.get("lessons");
      const courseLessons = lessons.filter(l => l.course_id === id);
      const courseLessonIds = courseLessons.map(l => l.id);

      this.set("lessons", lessons.filter(l => l.course_id !== id));

      const enrollments = this.get("course_enrollments");
      this.set("course_enrollments", enrollments.filter(e => e.course_id !== id));

      const submissions = this.get("submissions");
      this.set("submissions", submissions.filter(s => !courseLessonIds.includes(s.lesson_id)));

      const progress = this.get("lesson_progress");
      this.set("lesson_progress", progress.filter(p => !courseLessonIds.includes(p.lesson_id)));
    } else if (table === "lessons") {
      const lessons = this.get("lessons");
      const lessonToDelete = lessons.find(l => l.id === id);
      this.set("lessons", lessons.filter(l => l.id !== id));

      if (lessonToDelete) {
        const courseId = lessonToDelete.course_id;
        const courses = this.get("courses");
        const course = courses.find(c => c.id === courseId);
        if (course) {
          this.update("courses", courseId, { total_lessons: Math.max(0, (course.total_lessons || 1) - 1) });
        }
      }

      const submissions = this.get("submissions");
      this.set("submissions", submissions.filter(s => s.lesson_id !== id));

      const progress = this.get("lesson_progress");
      this.set("lesson_progress", progress.filter(p => p.lesson_id !== id));
    } else if (table === "small_groups") {
      const groups = this.get("small_groups");
      this.set("small_groups", groups.filter(g => g.id !== id));

      const members = this.get("small_group_members");
      this.set("small_group_members", members.filter(m => m.group_id !== id));

      const attendance = this.get("small_group_attendance");
      this.set("small_group_attendance", attendance.filter(a => a.group_id !== id));

      const posts = this.get("small_group_posts");
      this.set("small_group_posts", posts.filter(p => p.group_id !== id));
    } else {
      const data = this.get(table);
      const filtered = data.filter(item => item.id !== id);
      this.set(table, filtered);
    }
  },

  query(table, filterFn) {
    const data = this.get(table);
    return data.filter(filterFn);
  },

  reset() {
    localStorage.clear();
    Object.keys(SEED_DATA).forEach(table => {
      this.set(table, SEED_DATA[table]);
    });
    console.log("Mock DB Reset Complete!");
  }
};

// Initialize DB if not present
function initDB() {
  Object.keys(SEED_DATA).forEach(table => {
    if (!localStorage.getItem(`mokyang_${table}`)) {
      DB.set(table, SEED_DATA[table]);
    }
  });
}

initDB();

// Global export for script modules
window.DB = DB;
