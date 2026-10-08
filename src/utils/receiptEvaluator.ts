import { DailySummaryStats } from '../types';

export interface EvaluationResult {
  title: string;
  quote: string;
  rankGrade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface BarcodeScanItem {
  tag: string;
  title: string;
  detail: string;
  severity: 'legend' | 'ok' | 'warning' | 'critical' | 'easter';
}

/**
 * 8大分數常規段位 + 4大行為彩蛋評級系統
 */
export function evaluateDailyAppraisal(stats: {
  healthScore: number;
  yawnsCaught: number;
  frownsCaught: number;
  sedentaryLocksCount: number;
  slackMinutesEarned: number;
  overtimeMinutes: number;
}): EvaluationResult {
  const {
    healthScore,
    yawnsCaught,
    frownsCaught,
    sedentaryLocksCount,
    slackMinutesEarned,
    overtimeMinutes,
  } = stats;

  // 決定性雜湊選取（依據今日數據特徵與分數決定，不使用 Math.random()，確保同一數據渲染時金句絕對穩定、不再閃爍跳動）
  const seed = Math.abs(
    Math.round(healthScore * 17) +
      yawnsCaught * 37 +
      frownsCaught * 53 +
      slackMinutesEarned * 23 +
      sedentaryLocksCount * 19 +
      overtimeMinutes * 41
  );
  const pickStableQuote = (list: string[]) => list[seed % list.length];

  // 1. 優先判定行為彩蛋特質稱號（當行為達到極端特徵時觸發）
  if (slackMinutesEarned >= 15 && healthScore >= 65) {
    const quotes = [
      '工位空蕩蕩，薪水照樣拿，這才是職場頂級拉扯。',
      '能坐著絕不站著，能離座絕不碰鍵盤，長壽秘訣盡在於此。',
      `帶薪離席滿滿 ${slackMinutesEarned} 分鐘，每一步都在奪回被資本家抽取的心頭血。`,
      '夾縫中深呼吸、茶水間裡看風水，職場生存哲學家非你莫屬。',
      '適度摸魚才是打工人的護體神功，今天打得一手好太極。',
    ];
    return {
      title: '榮耀薪水小偷 Lv.MAX',
      quote: pickStableQuote(quotes),
      rankGrade: 'S',
    };
  }

  if (yawnsCaught >= 5) {
    const quotes = [
      '嘴巴張開的弧度，是靈魂想要脫離肉體的維度。',
      `今天張嘴連環造氧 ${yawnsCaught} 次，把辦公室的二氧化碳都吸光了。`,
      '哈欠是身體對資本世界無聲而莊嚴的抗議。',
      '眼角泛淚不是受了委屈，是床鋪在隔空向你發出熱烈召喚。',
      '靈魂已在雲端漫遊，肉身僅在工位掛機，下班快回被窩充電。',
    ];
    return {
      title: '深淵巨口哈欠大師',
      quote: pickStableQuote(quotes),
      rankGrade: 'B',
    };
  }

  if (frownsCaught >= 6) {
    const quotes = [
      '眉心夾死蒼蠅，公事依舊堆積；下班請立刻鬆開印堂。',
      `今天眉頭深鎖 ${frownsCaught} 次，老闆的年終可沒包含你的肉毒桿菌補償費。`,
      '世上本無事，庸人自擾之；若有急事，明天再說也是種大智慧。',
      '公文是過眼雲煙，法令紋卻是自己的，走出大門請立刻微笑。',
      '把緊繃的五官交給晚風吹散，今晚誰傳訊息都不准看。',
    ];
    return {
      title: '愁容滿面結界使',
      quote: pickStableQuote(quotes),
      rankGrade: 'B',
    };
  }

  if (overtimeMinutes >= 20) {
    const quotes = [
      '你的每一分血汗加班，都在替老闆的法拉利油箱添磚加瓦。',
      `加班 ${overtimeMinutes} 分鐘，靈魂已被吸取大半，快跑，別回頭！`,
      '燃燒自己照亮老闆的財報，今晚請務必吃頓大餐贖回靈魂。',
      '辦公室的燈火通明，照耀著打工人疲憊卻倔強的肝臟。',
      '資本家的感謝信是假的，你的疲倦是真的，現在就打卡離場！',
    ];
    return {
      title: '老闆超跑圓夢功臣',
      quote: pickStableQuote(quotes),
      rankGrade: 'C',
    };
  }

  // 2. 8大分數常規段位評級
  if (healthScore >= 95) {
    const quotes = [
      '氣定神閒，泰山崩於前而摸魚如故，達到了職場禪宗最高境界。',
      '生命存摺滿血結算！你是把辦公椅坐出高級養生溫泉感的神人。',
      '身心防禦點滿，資本的鐮刀割過來都瞬間捲刃。',
      '水豚精神貫徹始終：心態平和、多喝溫水，平安活到一百歲。',
      '工位上的定海神針，不內耗、不焦慮，準時打卡笑看風雲。',
    ];
    return {
      title: '仙品級工位水豚',
      quote: pickStableQuote(quotes),
      rankGrade: 'SSS',
    };
  }

  if (healthScore >= 88) {
    const quotes = [
      '夾縫中喝水伸展，步步為營，長命百歲的工位典範。',
      '身心盈餘充沛，下班腳步輕快如風，今晚准予吃頓好的！',
      '工作是公司的，健康是自己的，你抓住了人生的第一要義。',
      '懂得在螢幕前保留最後三分真氣，職場長跑的絕對贏家。',
      '心率平穩、呼吸悠長，神仙身心防禦系統完美通關。',
    ];
    return {
      title: '養生摸魚大宗師',
      quote: pickStableQuote(quotes),
      rankGrade: 'SS',
    };
  }

  if (healthScore >= 80) {
    const quotes = [
      '抗壓防護網依然堅挺，及時離座伸展，守住了生命底線。',
      '下班準點收拾桌面，不帶走一片烏雲，這就是專業。',
      '電量保持良好，回家還能打兩把遊戲，精力管理大師。',
      '平穩放電，遠離暴斃邊緣，可喜可賀的戰鬥結算。',
      '及時補水、坐姿舒展，戰術性維持了極佳的生存體徵。',
    ];
    return {
      title: '身心防禦特級勞工',
      quote: pickStableQuote(quotes),
      rankGrade: 'S',
    };
  }

  if (healthScore >= 70) {
    const quotes = [
      '微量緊繃但結構穩定，回家請立刻洗澡平躺切斷所有聯繫。',
      '在崩潰與元氣的臨界點精準剎車，今天安全著陸。',
      '平平安安下班，勝造七級浮屠，記得晚餐多喝點熱湯。',
      '螺絲釘亦有靈魂，今日運轉已達上限，請停止一切思考。',
      '下班鐘聲敲響，打工面具即刻卸下，回歸真實的自己。',
    ];
    return {
      title: '標準職場螺絲釘',
      quote: pickStableQuote(quotes),
      rankGrade: 'A',
    };
  }

  if (healthScore >= 58) {
    const quotes = [
      '生命力跌破安全閥，薪水不值換命，今晚請嚴禁碰任何公務通訊！',
      '電量剩餘 20%，請立刻插入充電線（床鋪），進入深度省電模式。',
      '咖啡因已無法欺騙神經系統，身體正在發出平躺通牒。',
      '今日份的人間歷練已超載，回家開啟飛航模式保平安。',
      '眼皮沉重、肩頸僵硬，請善待自己，明天再戰江湖。',
    ];
    return {
      title: '低電量人體電池',
      quote: pickStableQuote(quotes),
      rankGrade: 'B',
    };
  }

  if (healthScore >= 45) {
    const quotes = [
      '元氣嚴重赤字！再不離開椅子，靈魂就要跟鍵盤融為一體了。',
      '打工打出了修仙歷劫感，快放下滑鼠，去大自然洗滌雙眼。',
      '身體電池紅燈閃爍，請即刻執行休眠協議，拒絕一切社交。',
      '今日受損程度偏高，強烈建議今晚補充 500ml 溫水並早睡。',
      '過熱警報持續響起，再不回家冷卻，處理器就要融毀了。',
    ];
    return {
      title: '極限超載碳基生物',
      quote: pickStableQuote(quotes),
      rankGrade: 'C',
    };
  }

  if (healthScore >= 30) {
    const quotes = [
      '靈魂已脫水出竅，急需深層睡眠或大自然森林浴全面搶救！',
      '打工不是渡劫，別用肉身硬抗資本大砲，今晚徹底躺平。',
      '殘存血量見底，系統警告：禁止任何形式的心靈內耗。',
      '身體不是鋼鐵做的，請對自己溫柔一點，下班就是全世界。',
      '生命存摺已近枯竭，今晚嚴禁熬夜滑手機，保命要緊。',
    ];
    return {
      title: '瀕危人體電池',
      quote: pickStableQuote(quotes),
      rankGrade: 'D',
    };
  }

  // < 30 分
  const quotes = [
    '生命體徵瀕臨臨界點！立刻放下手邊一切，閉上雙眼原地放空！',
    '今日耗損已達人體極限，明天請務必實踐帶薪摸魚哲學。',
    '老闆的法拉利有了，你的肝臟在哭了，今晚禁止思考任何事。',
    '搶救打工人刻不容緩，今晚九點前強制上床睡覺！',
    '神魂分離、元氣告急，請立刻呼叫床鋪進行緊急迫降。',
  ];
  return {
    title: '深淵級燃燒社畜',
    quote: pickStableQuote(quotes),
    rankGrade: 'E',
  };
}

/**
 * 條碼掃描文字資料庫：35+ 種截然不同的驗證報告（5大分類）
 */
export function getBarcodeVerificationPool(stats: DailySummaryStats): BarcodeScanItem[] {
  const score = stats.finalHealthScore;
  const pool: BarcodeScanItem[] = [];

  // 1. 神級滿血類 (score >= 90)
  if (score >= 90) {
    pool.push(
      {
        tag: 'CAPITAL_IMMUNE',
        title: '【身心飛仙】資本鐮刀免疫體質',
        detail: '身心存摺幾近滿格！將摸魚與養生融合成藝術，准予昂首闊步下班 🦹‍♂️',
        severity: 'legend',
      },
      {
        tag: 'WATER_CAPYBARA',
        title: '【水豚認證】工位情緒穩定典範',
        detail: '今日氣定神閒、體內水分充足，抗壓結界完好無損，身心品質特級 🧘',
        severity: 'legend',
      },
      {
        tag: 'BATTERY_99%',
        title: '【滿血歸航】生物電量依然充沛',
        detail: '下班時分仍保有 90%+ 充沛元氣，今晚適合發展興趣或享受美食 🍣',
        severity: 'legend',
      },
      {
        tag: 'ZEN_MASTER',
        title: '【禪定打工】超凡脫俗生存大師',
        detail: '在繁雜公事中保有一方清泉淨土，心率平穩、姿態舒展，完美過關 🌿',
        severity: 'legend',
      },
      {
        tag: 'HEALTH_GOLD',
        title: '【全勤仙人】細胞修復力特優',
        detail: '眨眼頻率自然、眉部無淤積壓力，系統判定為今日工位最高榮譽勞工 🏆',
        severity: 'legend',
      },
      {
        tag: 'DEFENSE_MAX',
        title: '【神級結界】內耗防護率 99.8%',
        detail: '成功將一切無謂的焦慮反彈回虛空，身心存摺無失血紀錄，准予放假 🛡️',
        severity: 'legend',
      },
      {
        tag: 'METABOLISM_PRO',
        title: '【代謝永動】循環代謝奇蹟',
        detail: '起立伸展節奏分秒不差，血液循環如多瑙河般奔騰順暢 🌊',
        severity: 'legend',
      }
    );
  }

  // 2. 標準合格類 (score >= 70)
  if (score >= 70) {
    pool.push(
      {
        tag: 'SCAN_OK',
        title: '【打卡合格】資質優良標準勞工',
        detail: '身心存摺盈餘充沛，各項生物指標全數達標，准予安心下班 🟢',
        severity: 'ok',
      },
      {
        tag: 'BALANCE_PASS',
        title: '【平衡通過】元氣維持基本盤',
        detail: '工作與自我調節平衡極佳，精力殘存充盈，今晚盡情享受私人時光 🥂',
        severity: 'ok',
      },
      {
        tag: 'RADAR_CLEAN',
        title: '【掃描無虞】抗損耗防禦達標',
        detail: '眼球濕潤度良好、無長時間苦情皺眉，生活節奏掌握得宜 ⚡',
        severity: 'ok',
      },
      {
        tag: 'APPROVED',
        title: '【系統准放】常態社畜模範生',
        detail: '脊椎減壓及時、及格離席，下班通關條碼驗證無誤，請速回家放鬆 🏄',
        severity: 'ok',
      },
      {
        tag: 'RESERVE_GOOD',
        title: '【庫存良好】血量仍在安全線',
        detail: '雖有微量疲勞但自我修復機能正常，熱水澡後即可完全滿血 🛁',
        severity: 'ok',
      },
      {
        tag: 'SAFE_ZONE',
        title: '【安全著陸】今日工時平穩封存',
        detail: '無重大過勞或體力透支警訊，條碼資料庫已蓋章備查，晚間自由 🌟',
        severity: 'ok',
      },
      {
        tag: 'POSTURE_OK',
        title: '【骨骼健在】脊椎抗壓成功守備',
        detail: '工位坐姿維持標準視距，未發生嚴重前傾烏龜頸，准予通關 🐢',
        severity: 'ok',
      }
    );
  }

  // 3. 中度損耗類 (score >= 50 && score < 70, 或分數在 50~75 之間做補充)
  if (score < 70) {
    pool.push(
      {
        tag: 'SCAN_WARN',
        title: '【電量偏低】人體電池黃燈示警',
        detail: '生理年齡出現微量虛長，今晚請嚴禁碰任何公務通訊軟體 ⚠️',
        severity: 'warning',
      },
      {
        tag: 'EYE_FATIGUE',
        title: '【視力告急】螢幕疲倦過載徵兆',
        detail: '捕捉到頻繁眼輪匝肌緊繃，回家請敷熱毛巾或極目遠眺放空 👁️',
        severity: 'warning',
      },
      {
        tag: 'DRAIN_ALERT',
        title: '【精力赤字】儲備電量不足三成',
        detail: '神經系統輕微緊繃，強烈建議晚間八點後開啟手機飛航模式 🛑',
        severity: 'warning',
      },
      {
        tag: 'SPINE_WARN',
        title: '【脊椎抗議】久坐壓力沉積警報',
        detail: '腰椎與坐骨神經承受長時間重力壓迫，回家請務必平躺做伸展 🧘',
        severity: 'warning',
      },
      {
        tag: 'DEHYDRATION',
        title: '【細胞缺水】代謝機能輕度滯怠',
        detail: '工位久坐水分蒸發過甚，晚間記得補充 400ml 溫水與新鮮水果 🍊',
        severity: 'warning',
      },
      {
        tag: 'REST_CALL',
        title: '【急需充電】請執行日常保養',
        detail: '今日工作負載已達臨界，不可再去續攤熬夜，準時上床恢復元氣 🛌',
        severity: 'warning',
      },
      {
        tag: 'BRAIN_WARM',
        title: '【思緒過載】思考核心輕度發燙',
        detail: '資訊輸入已達本日上限，今晚嚴禁觀看燒腦懸疑劇，看喜劇放鬆 📺',
        severity: 'warning',
      }
    );
  }

  // 4. 重度瀕危警報類 (score < 50)
  if (score < 50) {
    pool.push(
      {
        tag: 'CRITICAL_RED',
        title: '【超載攔截】生命力嚴重透支',
        detail: '生命存摺跌入紅色深淵！請立刻就地解散，平躺放空禁止思考 🚨',
        severity: 'critical',
      },
      {
        tag: 'ICU_REST',
        title: '【瀕危警告】靈魂已脫水出竅',
        detail: '身體硬體過熱、精神軟體卡頓，嚴禁任何形式的自責與焦慮 🧊',
        severity: 'critical',
      },
      {
        tag: 'BURNOUT_ALARM',
        title: '【暴走截停】打工渡劫過度超載',
        detail: '老闆的財報不需要你拿命去填！立刻回家倒頭大睡，明天準時下班 🛌',
        severity: 'critical',
      },
      {
        tag: 'RECHARGE_NOW',
        title: '【強制休眠】電量見底殘存 5%',
        detail: '生理年齡暴增，身體強烈抗議中，今晚唯一KPI：把自己哄睡著 🌙',
        severity: 'critical',
      },
      {
        tag: 'CPU_MELTDOWN',
        title: '【腦力融毀】大腦處理器已降頻',
        detail: '神經傳導物質耗盡，再想公事只會當機，下班即是新生，快走！ 🌪️',
        severity: 'critical',
      },
      {
        tag: 'EMERGENCY_OFF',
        title: '【終極警報】健康存摺見骨虧損',
        detail: '系統強制介入關機程序，今晚拒絕一切外界干擾，啟動大修復 🆘',
        severity: 'critical',
      },
      {
        tag: 'HEAVY_HEART',
        title: '【精神枯竭】急需深海靈魂浴',
        detail: '今日心力消耗過大，今晚給自己買一杯甜飲，這不是任性是急救 🧋',
        severity: 'critical',
      }
    );
  }

  // 5. 動態行為彩蛋項目（根據當天行為注入）
  if (stats.slackMinutesEarned >= 10) {
    pool.push({
      tag: 'SLACK_KING',
      title: '【奉旨摸魚】薪水小偷榮譽認證',
      detail: `今日累計離座 ${stats.slackMinutesEarned} 分鐘，成功從資本家手中奪回生命主權 ☕`,
      severity: 'easter',
    });
  }

  if (stats.yawnsCaught >= 3) {
    pool.push({
      tag: 'YAWN_KING',
      title: '【哈欠連環】辦公室造氧先驅',
      detail: `今日共被捕捉 ${stats.yawnsCaught} 次深淵巨口，下班第一件事：飛奔向床鋪 🥱`,
      severity: 'easter',
    });
  }

  if (stats.frownsCaught >= 4) {
    pool.push({
      tag: 'FROWN_ALERT',
      title: '【苦情臉譜】眉心夾死公文王',
      detail: `今日皺眉 ${stats.frownsCaught} 次！提醒您：公事可以重來，膠原蛋白一去不返 💆`,
      severity: 'easter',
    });
  }

  if (stats.overtimeMinutes >= 10) {
    pool.push({
      tag: 'FERRARI_DONOR',
      title: '【超跑贊助商】老闆頒發榮譽功臣',
      detail: `超時賣命 ${stats.overtimeMinutes} 分鐘，法拉利輪胎已到貨！快跑去吃宵夜贖回靈魂 🏎️`,
      severity: 'easter',
    });
  }

  return pool;
}

/**
 * 取得官方印章的視覺標籤與文字
 */
export function getReceiptStampInfo(healthScore: number): {
  text: string;
  subText: string;
  borderColor: string;
  textColor: string;
  canvasStroke: string;
} {
  if (healthScore >= 90) {
    return {
      text: 'LEGEND / 仙品滿血',
      subText: '特優通行',
      borderColor: 'border-cyan-500',
      textColor: 'text-cyan-700',
      canvasStroke: '#0891b2',
    };
  }
  if (healthScore >= 70) {
    return {
      text: 'PASS / 打卡合格',
      subText: '准予下班',
      borderColor: 'border-emerald-600',
      textColor: 'text-emerald-700',
      canvasStroke: '#059669',
    };
  }
  if (healthScore >= 50) {
    return {
      text: 'WARN / 輕度耗損',
      subText: '注意充電',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-700',
      canvasStroke: '#d97706',
    };
  }
  return {
    text: 'RECHARGE / 需補元氣',
    subText: '強制休眠',
    borderColor: 'border-red-500',
    textColor: 'text-red-600',
    canvasStroke: '#dc2626',
  };
}
