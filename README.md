# 書いて育てる（製品版 v1）

手書きの日記・ノートを書くと、ドット絵の少年が熱く育つPWA。
中身は読まない。測るのはインク（暗いピクセル）の量だけ。写真は端末の中で測って捨て、保存しない。

## 仕組み
- 静的サイト（このフォルダ一式）＋ Supabase（認証とデータ）。
- `config.js` の `SUPABASE_URL` / `SUPABASE_ANON_KEY` が空の間はデモモード（localStorage）で全機能が動く。
- 成長：ステージ = f(今月の総インク, 直近に書いた日のインク)。パラメータは `config.js` に集約。過去の月は図鑑に凍結され、式を変えても動かない。

## 公開手順
1. GitHub に新しいリポジトリを作り、このフォルダの中身を置く。Settings → Pages で main ブランチを公開する。
2. Supabase で新しいプロジェクトを作る。SQL Editor で `supabase-schema.sql` を実行する。
3. プロジェクトの URL と anon key を `config.js` に書く（Authentication → Providers で Email を有効に）。
4. 2人とも公開URLを開き、新規登録して使う。ホーム画面に追加するとアプリのように開ける。

## ローカル確認
```
python3 -m http.server 8000
# http://localhost:8000 を開く（デモモード）
```
