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
    //Callオブジェクト
    var existingCall;

    //localStream
    var localStream;

    // Compatibility
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // PeerJSオブジェクトを生成
    var peer = new Peer({ key: APIKEY, debug: 3 });

    var hostConn;

    function dataConnMessage(conn) {
        // メッセージを受信できるようになった時
        conn.on('open', data => {
            console.log('Received', data);
            // 接続先のhostか聞いてみる
            conn.send('host?');
        });

        //メッセージを受信
        conn.on('data', data => {
            if(data === 'host') {
                hostConn = conn;
                conn.send('getStream');
                $('#otherpeerid').val(conn.peer);
            } else if(data === 'readyStream') {
                //準備中
                $('#otherpeerid').val(conn.peer);
            } else {
                conn.close();
            }
        });
    }

    $('#step3').hide();

    // PeerIDを生成
    peer.on('open', function () {
        $('#my-id').text(peer.id);
        if(peer) {
            peer.listAllPeers(function(list) { 
                for(var peerID in list) {
                    var conn = peer.connect(list[peerID]);
                    dataConnMessage(conn);
                }
            });
        }
    });

    // 相手からのコールを受信したら自身のメディアストリームをセットして返答
    peer.on('call', function (call) {
        call.answer(localStream);

        // 相手からのメディアストリームを待ち受ける
        call.on('stream', function (stream) {
            attachMediaStream_($('#their-video')[0],stream);
        });

        // 相手がクローズした場合
        call.on('close', step2);

        // Callオブジェクトを保存
        existingCall = call;

        // UIコントロール
        $('#their-id').text(call.peer);
        $('#step2').hide();
        $('#step3').show();
        $('#their-video').show();
    });

    //相手からデータコネクションで受信が来た時に相手側のメディアストリームを呼ぶ
    //そうするとこちらからの画面だけを送信できる
    peer.on('connection', function(conn) {
        conn.on('data', function(data) {
            if(data === 'host?') {
                conn.send('gest');
                console.log('Received', data);
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
            if(hostConn) {
                hostConn.send('getStream');
            }
        });

        // 切断 //受信側の機能で必要
        $('#end-call').click(function () {
            existingCall.close();
            step2();
        });

        $('#timelineSend').click(function(){
            hostConn.send($('#timeline').val());
            $('#timeline').val('');
        });

        //スクリーンシェアを終了 //配信側の機能で必要
        $('#stop-screen').click(function () {
            existingCall.close();
            $('#step1').show();
            $('#step3').hide();
            $('#their-video').hide();
        });
    });


    function step2() {
        //UIコントロール
        $('#step3').hide();
        $('#step2').show();
        $('#their-video').hide();
    }

    function getUM(success,error) {
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