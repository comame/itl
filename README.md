# itl-web

iTunes のライブラリを Windows から読みだして、Web で聴けるようにするためのもの。

## 注意

**私的利用に留めてください**。自身のライブラリを他人と共有するために使用しないでください。

# セットアップ

## 想定する実行環境

- サーバ
    - FFmpeg がインストールされている Linux
- iTunes
    - ネットワーク経由のファイル共有が使用できる Windows

## 開発環境

- 依存関係をインストールする
  - Go, Node.js, FFmpeg
- Windows のファイル共有を設定する
  - iTunes のライブラリフォルダ (`C:\Users\user\Music\iTunes` など) をネットワークに共有する
- `iTunes Media Library.xml` を出力できるようにする
  - iTunes の環境設定で「iTunesライブラリXMLをほかのアプリケーションと共有」をオンする
- `.env` を書き換える
  - `SMB_HOST`: iTunes ライブラリのある Windows マシンのホスト名と SMB のポート
  - `SMB_USER`: Windows のユーザー名
  - `SMB_PASSWORD`: Windows のパスワード
  - `SMB_SHARENAME`: iTunes のライブラリフォルダの共有名
  - `ITUNES_LOCATION_PREFIX`: `iTunes Music Library.xml` の存在するファイルパス

- 以下のコマンドを実行する

```
$ make dev-setup
$ make dev
```
