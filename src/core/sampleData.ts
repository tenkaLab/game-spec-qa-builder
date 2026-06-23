import type { BuildState, DefinitionData } from './types.ts'

export const sampleDefinitionData: DefinitionData = {
  questions: [
    {
      id: 'question_movement',
      text: 'ゲームの基本操作は？',
      options: [
        {
          id: 'answer_move_4dir',
          label: '4方向移動',
          addModuleIds: ['player_move_4dir'],
        },
        {
          id: 'answer_move_side_scroll',
          label: '横スクロール移動',
          addModuleIds: ['player_move_side_scroll'],
        },
      ],
    },
    {
      id: 'question_defeat',
      text: '敗北条件は？',
      options: [
        {
          id: 'answer_defeat_collision',
          label: '敵に触れたら即ゲームオーバー',
          addModuleIds: ['collision_game_over', 'enemy_spawn_from_top'],
        },
        {
          id: 'answer_defeat_hp',
          label: 'HPが0になったらゲームオーバー',
          addModuleIds: ['hp_system', 'enemy_spawn_from_top'],
        },
      ],
    },
    {
      id: 'question_score',
      text: 'スコア条件は？',
      options: [
        {
          id: 'answer_score_time',
          label: '時間経過でスコア加算',
          addModuleIds: ['score_by_time'],
        },
        {
          id: 'answer_score_item',
          label: 'アイテム取得でスコア加算',
          addModuleIds: ['item_collect_score'],
        },
      ],
    },
    {
      id: 'question_item_spawn',
      text: 'スコアアイテムをどのように出現させますか？',
      options: [
        {
          id: 'answer_item_spawn',
          label: '一定間隔で出現させる',
          addModuleIds: ['item_spawn'],
        },
      ],
    },
  ],
  modules: [
    {
      id: 'player_move_4dir',
      name: '4方向移動',
      category: 'player',
      description: 'プレイヤーが上下左右に移動する。',
    },
    {
      id: 'player_move_side_scroll',
      name: '横スクロール移動',
      category: 'player',
      description: 'プレイヤーが横スクロール空間を移動する。',
    },
    {
      id: 'enemy_spawn_from_top',
      name: '上部からの敵出現',
      category: 'enemy',
      description: '敵が画面上部から出現する。',
    },
    {
      id: 'collision_game_over',
      name: '接触ゲームオーバー',
      category: 'rule',
      description: 'プレイヤーが敵に触れるとゲームオーバーになる。',
    },
    {
      id: 'hp_system',
      name: 'HPシステム',
      category: 'system',
      description: 'ダメージによってHPが減少する。',
    },
    {
      id: 'score_by_time',
      name: '時間スコア',
      category: 'score',
      description: '時間経過に応じてスコアを加算する。',
    },
    {
      id: 'item_spawn',
      name: 'アイテム出現',
      category: 'item',
      description: 'ゲーム内に取得可能なアイテムを出現させる。',
    },
    {
      id: 'item_collect_score',
      name: 'アイテム取得スコア',
      category: 'score',
      description: 'アイテム取得時にスコアを加算する。',
    },
  ],
  constraints: [
    {
      id: 'requires_enemy_for_collision',
      type: 'requires',
      targetModuleId: 'collision_game_over',
      relatedModuleIds: ['enemy_spawn_from_top'],
      message: '接触ゲームオーバーには敵の出現仕様が必要です。',
      resolveQuestionIds: ['question_defeat'],
    },
    {
      id: 'requires_spawn_for_item_score',
      type: 'requires',
      targetModuleId: 'item_collect_score',
      relatedModuleIds: ['item_spawn'],
      message: 'アイテム取得スコアにはアイテムの出現仕様が必要です。',
      resolveQuestionIds: ['question_item_spawn'],
    },
    {
      id: 'exclusive_player_movement',
      type: 'exclusive_group',
      targetModuleId: 'player_move_4dir',
      relatedModuleIds: ['player_move_side_scroll'],
      message: '4方向移動と横スクロール移動は同時に選択できません。',
      resolveQuestionIds: ['question_movement'],
    },
    {
      id: 'conflicts_collision_and_hp',
      type: 'conflicts',
      targetModuleId: 'collision_game_over',
      relatedModuleIds: ['hp_system'],
      message: '即ゲームオーバーとHPシステムは同時に選択できません。',
      resolveQuestionIds: ['question_defeat'],
    },
    {
      id: 'requires_any_movement_for_time_score',
      type: 'requires',
      targetModuleId: 'score_by_time',
      relatedModuleIds: ['player_move_4dir', 'player_move_side_scroll'],
      requirementMode: 'any',
      message: '時間スコアにはゲームの基本操作が必要です。',
      resolveQuestionIds: ['question_movement'],
    },
  ],
  parameterDefinitions: [
    {
      id: 'parameter_player_speed',
      moduleId: 'player_move_4dir',
      key: 'playerSpeed',
      label: 'プレイヤー速度',
      valueType: 'number',
      inputKind: 'number',
      defaultValue: 5,
    },
    {
      id: 'parameter_enemy_spawn_interval',
      moduleId: 'enemy_spawn_from_top',
      key: 'enemySpawnInterval',
      label: '敵の出現間隔',
      valueType: 'number',
      inputKind: 'number',
      defaultValue: 1,
    },
    {
      id: 'parameter_player_color',
      moduleId: 'player_move_4dir',
      key: 'playerColor',
      label: 'プレイヤーの色',
      valueType: 'string',
      inputKind: 'color',
      defaultValue: '#60a5fa',
    },
    {
      id: 'parameter_control_scheme',
      moduleId: 'player_move_4dir',
      key: 'controlScheme',
      label: '操作方法',
      valueType: 'string',
      inputKind: 'select',
      defaultValue: 'keyboard',
      options: [
        { label: 'キーボード', value: 'keyboard' },
        { label: 'ゲームパッド', value: 'gamepad' },
      ],
    },
  ],
}

export function createEmptyBuildState(): BuildState {
  return {
    selectedAnswerIds: [],
    parameterValues: {},
    history: {
      entries: [],
      currentIndex: -1,
    },
  }
}
