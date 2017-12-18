/**
 * SkyWay Screenshare Sample App
 * @author NTT Communications(skyway@ntt.com)
 * @link https://github.com/nttcom/SkyWay-ScreenShare
 * @license MIT License
 */

$(document).ready(function () {

    var APIKEY = 'e31a07c3-9c2b-4181-90f9-d50b9fea1ab1';//'9d46d478-e4a3-49e5-b743-e7bbe059ad03';

    //ユーザーリスト
    var userList = [];

    //localStream
    var localStream;

    // Compatibility
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // PeerJSオブジェクトを生成
    var peer = new Peer({ key: APIKEY, debug: 3 });

    // スクリーンキャプチャの準備
    var screen = ScreenShare.create({debug: true});

    // PeerIDを生成
    peer.on('open', function () {
        $('#my-id').text(peer.id);
    });

    //相手からデータコネクションで受信が来た時に相手側のメディアストリームを呼ぶ
    //そうするとこちらからの画面だけを送信できる
    peer.on('connection', conn => {
        conn.send('host');
        conn.on('data', data => {
            if(data === 'host?') {
                conn.send('host');
                console.log('Received', data);
            } else if(data === 'getStream') {
                if(localStream){
                    peer.call(conn.peer, localStream);
                    $('#users').append('<textarea id="' + conn.peer + '"></textarea>');
                } else {
                    conn.send('readyStream');
                }
            } else {
                var str = $('#' + conn.peer).val() + '\n' + data
                str = str.replace(/\\n/g, "\n");
                $('#' + conn.peer).val(str);
            }
        });
    });

    // エラーハンドラー
    peer.on('error', function (err) {
        alert(err.message);
        step2();
    });

    // イベントハンドラー
    $(function () {
        // 相手に接続
        $('#make-call').click(function () {
            var call = peer.connect($('#otherpeerid').val());
            step3(call);
        });

        //スクリーンシェアを開始
        $('#start-screen').click(function () {
            if(screen.isScreenShareAvailable() === false){
                screen.start({
                    Width: $('#Width').val(),
                    Height: $('#Height').val(),
                    FrameRate: $('#FrameRate').val()
                })
                .then(stream => {
                    attachMediaStream_($('#my-video')[0],stream);
                    localStream = stream;

                })
                .then(error => {
                    console.log(error);
                });
                /*
                ,function(){
                    alert('ScreenShareを終了しました');
                });
                */
            } else {
                alert('ExtensionまたはAddonをインストールして下さい');
            }

        });
    });

    function step3(call) {
        // 相手からのメディアストリームを待ち受ける
        call.on('stream', function (stream) {
            attachMediaStream_($('#their-video')[0],stream);
        });

        // UIコントロール
        $('#their-id').text(call.peer);
        $('#ConnectionOut').show();
    }

    function getUM(success,error){
        navigator.getUserMedia({ audio: true, video: true }, function (stream) {
            success(stream);
        }, function (err) {
            error(err);
        });
    }

    function attachMediaStream_(videoDom,stream){
        // Adapter.jsをインクルードしている場合はそちらのFunctionを利用する
        if(typeof (attachMediaStream) !== 'undefined' && attachMediaStream){
            attachMediaStream(videoDom,stream);
        } else {
            videoDom.setAttribute('src', URL.createObjectURL(stream));
        }
    }
});