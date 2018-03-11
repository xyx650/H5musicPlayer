let musicRender = (function ($) {
    let $topTime = $('.top .topTime'), //时间区域
        $lyricBox = $('.lyricBox'),    //歌词区域
        $headerBox = $('.headerBox'),   //header区域
        //$progressBox = $('.progressBox'),  //进度条区域
        $progressBar = $('.progressBar'),  //进度条总宽
        $progressbtn = $('.progressbtn'),  //进度条原点
        $footerBox = $('.footerBox'),   //底部按钮区域
        $progressing = $('.progressing'),   //红色进度条
        $discBox = $('.discBox'),   //disc区域
        audio = $('#audio')[0],
        $mute = $('#mute'),         //音量按钮
        $play = $('#play'),         //播放/暂停按钮
        $prev = $('#prev'),         //上一首按钮
        $next = $('#next'),         //下一首按钮
        $loadBar = $('.loaded'),         //loaded进度
        $playMode = $('#playMode'),         //循环/随机播放按钮
        $disc = $('.disc'),
        $rocker = $('.rocker');

    let songID = 0;  //歌曲id
    //$palyMode.attr('palyMode', 0);   //播放模式，0循环播放，1随机播放
    let getNow = function () {
        let now = new Date(),
            hour = now.getHours(),
            minute = now.getMinutes();
        hour = hour < 10 ? `0${hour}` : hour;
        minute = minute < 10 ? `0${minute}` : minute;
        $topTime.html(`${hour}:${minute}`);
    };


    //生成大于等于0小于length的随机整数，且不为num
    let makeRandom = (num, length) => {
        let randomNum = 0;
        do {
            randomNum = Math.floor(Math.random() * length);
        }
        while (randomNum === num);
        return randomNum;
    }
    //格式化时间为xx:xx
    let formatTime = (seconds) => {
        var totalS = Math.round(parseFloat(seconds));
        var minute = Math.floor((totalS / 60));
        var second = totalS - minute * 60;
        second = second < 10 ? ("0" + second) : second;
        minute = minute < 10 ? ("0" + minute) : minute;
        return minute + ":" + second;
    }
    // 格式化歌词
    let lyricFormat = (result) => {
        let ary = [];
        result.replace(/\[(\d+):(\d+\.\d+)\]([^\[\]\n]*)?\n?/g, (...arg) => {
            let [, minutes, seconds, value] = [...arg];
            let totalSeconds = parseFloat(minutes) * 60 + Math.round(parseFloat(seconds));
            if (value) {
                ary.push({
                    totalSeconds: totalSeconds,
                    value: value
                });
            }

            // console.log(ary);
            // console.log([...arg]);
        })
        return ary;
    }

    //绑定歌曲地址、歌曲名、歌手、海报背景、歌词信息
    let bindInfo = (result, i) => {
        result = result[i];
        // console.log(result.lyric);
        let tempAry = lyricFormat(result.lyric);
        // console.log(tempAry);
        let $songName = $('.songName'),
            $singer = $('.singer'),
            $discImg = $('.discImg'),
            $bg = $('.bg'),
            $wrapper = $lyricBox.children('.wrapper');
        // console.log(result);
        audio.src = result.songSrc;

        let str = ``;
        $(tempAry).each((index, item) => {
            str += `<p data-totalSeconds="${item.totalSeconds}">${item.value}</p>`;
        });
        // console.log(str);
        $wrapper.html(str);
        // console.log(result[i].songName);
        $songName.html(result.songName);
        $singer.html(result.singer);
        $discImg.css('backgroundImage', `url(${result.poster})`);
        $bg.css('backgroundImage', `url(${result.poster})`);

        // 判断文件缓冲进度
        setInterval(function () {
            let buffered, percent;
            // 已缓冲部分
            audio.readyState == 4 && (buffered = audio.buffered.end(0));

            // 已缓冲百分百
            audio.readyState == 4 && (percent = Math.round(buffered / audio.duration * 100) + '%');
            $loadBar.css('width',percent)
            // $loadBar.css = (Math.round(buffered / audio.duration * 100) * musicBar.clientWidth * 0.01) + 'px';
        }, 1000);

        audio.play();

        // console.log(audio.duration);

        // console.log(tempAry);
        // return lyricFormat(result, i);
    }


    //disc动画
    let discAnimation = () => {
        if (audio.paused) {
            $disc.removeClass('musicRotate');
            $rocker.css('transform', 'rotate(0)');
        } else {
            $disc.addClass('musicRotate');
            $rocker.css('transform', 'rotate(30deg)');

        }
    }


    //下一首
    // let next = function (result) {
    //     if ($playMode.attr('palyMode') === 0) {
    //         ++songID > songsLength - 1 && (++songID == 0);
    //     }
    // }
    //绑定歌曲时间 进度条
    let progessing = (result) => {
        let $curTime = $('#curTime'),
            $totalTime = $('#totalTime');

        // result = result[i];

        var progessTimer = setInterval((playmode) => {
            let duration = formatTime(audio.duration),
                currentTime = formatTime(audio.currentTime);
            $curTime.html(currentTime);
            $totalTime.html(duration);
            $progressing.css('width', Math.round(parseFloat(audio.currentTime)) / Math.round(parseFloat(audio.duration)) * 100 + '%');
            $progressbtn.css('left', Math.round(parseFloat(audio.currentTime)) / Math.round(parseFloat(audio.duration)) * 100 + '%');
            lyricMatch(Math.round(parseFloat(audio.currentTime)));
            if (currentTime >= duration) {
                songID = getNextIndex(result, playmode);
                bindInfo(result, songID);
                discAnimation();
                progessing(result);
            }
        }, 1000);
    }


    //->计算显示歌词区域lyricBox高度
    let computedLyricBox = () => {
        let winH = document.documentElement.clientHeight,
            font = parseFloat(document.documentElement.style.fontSize);
        let tempH = winH - $headerBox[0].offsetHeight - $footerBox[0].offsetHeight - $discBox[0].offsetHeight - 1.05 * font;
        tempH = tempH < 1.2 * font ? 0 : tempH;
        $lyricBox.css('height', tempH);
    }

    //歌词对应匹配
    let lyricMatch = (time) => {
        if (!audio.paused) {
            let $pList = $('.wrapper').children('p'),
                $wrapper = $('.wrapper'),
                $curP = $pList.filter(`[data-totalseconds="${time}"]`);
            if ($curP.length > 0) {
                $curP.addClass('current').siblings().removeClass('current');
            }
            let index = $curP.index();
            let pHeight = parseFloat($curP.css('height'));

            if (index > 1) {
                $wrapper.attr('style', `transform:translateY(${-(index - 1) * pHeight}px)`);
            }
            // if (Math.round(parseFloat(audio.currentTime)) >= Math.round(parseFloat(audio.duration))) {}
        }
    }

    //获取下一首index
    let getNextIndex = (result, playmode) => {
        playmode = $playMode.attr('playMode');
        let nextIndex = null;
        if (playmode == '0') {
            nextIndex = songID >= result.length - 1 ? 0 : songID + 1;
        } else if (playmode == '1') {
            nextIndex = makeRandom(songID, result.length - 1);
        }
        return nextIndex;
    }
    //获取上一首index
    let getPrevIndex = (result, playmode) => {
        playmode = $playMode.attr('playMode');
        let prevIndex = null;
        if (playmode == '0') {
            prevIndex = songID <= 0 ? result.length - 1 : songID - 1;

        } else if (playmode == '1') {
            prevIndex = makeRandom(songID, result.length - 1);
        }
        return prevIndex;
    }

    //发布订阅模式，创建一个计划表
    let $plan = $.Callbacks();
    $plan.add((result, i) => {
        bindInfo(result, i);
        discAnimation();
        progessing(result, i);

        // console.log(result.length);

    });
    $plan.add((result) => {
        $next.on('tap', (playmode) => {
            // playmode = $playMode.attr('playMode');
            // let nextIndex = null;
            // if (playmode == '0') {
            //     nextIndex = songID >= result.length - 1 ? 0 : songID + 1;
            // } else if (playmode == '1') {
            //     nextIndex = makeRandom(songID, result.length - 1);
            // }

            // audio.src = result[nextIndex].songSrc;
            // audio.play();
            songID = getNextIndex(result, playmode);
            bindInfo(result, songID);
            discAnimation();
            progessing(result);
            // songID = nextIndex;

        });

        $prev.on('tap', (playmode) => {

            songID = getPrevIndex(result, playmode);
            bindInfo(result, songID);
            discAnimation();
            progessing(result);
            // songID = nextIndex;

        });
    });
    $plan.add(function () {
        $progressbtn.one('touchstart', function (e) {
            let totalW = $progressBar.width(),
                leftDis = $progressing.offset().left,
                percent = 0;
            e.preventDefault();
            e.stopPropagation();
            $progressbtn.on('touchmove', function (e) {
                e.preventDefault();
                e.stopPropagation();
                let touchMove = e.changedTouches[0].clientX;
                let dis = touchMove - leftDis > totalW ? totalW : touchMove - leftDis;
                dis = touchMove - leftDis < 0 ? 0 : dis;
                percent = Math.floor(dis / totalW * 100) + "%";
                $progressing.css('width', percent);
                $progressbtn.css('left', percent);
            });
            $progressbtn.on('touchend', function (e) {
                e.preventDefault();
                e.stopPropagation();
                // console.log(audio.readyState);

                audio.currentTime = Math.round(parseFloat(audio.duration * parseFloat(percent) / 100));    //bug

                /*------------------------------------------------------
                https://segmentfault.com/q/1010000002908474

                具体来说，我用Intellij IDEA自带的服务器时（即IDEA直接打开html文件，鼠标移到编辑器的右上区域，出现一个有若干浏览器图标的横条，点击chrome图标，会使用idea自带的文件服务器用chrome打开，端口是63342），在chrome下拖动进度条也会出现跳到开头0S重新播放的问题，用IE11却正常。
                然后我试了另外一个hfs服务器（Http file server，是一个软件，并不是tomcat apache nginx之类的一个新的服务器，正好有这个软件顺便试一下），chrome下拖动完全正常。所以猜测原因是和服务器有关，具体来说可能是下载mp3文件时的http response header有关。下面是以上两种服务器的response header:
                【IDEA自带服务器】

                HTTP/1.1 200 OK
                Content-Type: audio/mpeg
                server: IntelliJ IDEA 14.1.7
                date: Thu, 02 Feb 2017 12:03:10 GMT
                X-Frame-Options: SameOrigin
                X-Content-Type-Options: nosniff
                x-xss-protection: 1; mode=block
                cache-control: private, must-revalidate
                last-modified: Sat, 28 Jan 2017 14:37:02 GMT
                content-length: 3694385
                【hfs服务器】

                HTTP/1.1 200 OK
                Content-Type: application/octet-stream
                Content-Length: 3694385
                Accept-Ranges: bytes
                Server: HFS 2.3d
                Last-Modified: Sat, 28 Jan 2017 14:37:02 GMT
                Content-Disposition: attachment; filename="%CB%B3%C1%F7%B6%F8%CF%C2 - %D5%C5%F6%A6%D3%B1     %CD%F2%BC%D2%C3%FA.mp3";
                一会儿再试一下tomcat和nginx。后面有发现的话再更新这个答案。



                刚正好遇到这个问题，错误发生在idea自带server在播放本地音频，soundmanager setPosition时自动归零。
                经验证是和response header有关的。我通过对MP3资源set不同的response header来验证，结果如下(貌似segmentfault不支持markdown的表格，所以下面排版有点乱。)：


                ie
                Content-Type 必须，当我设为audio/mpeg时才能播放，设为application/octet-stream不能。
                Content-Length必须。和Accept-Ranges无关。

                chrome
                Content-Type 无关，设为application/octet-stream可以播放。
                Content-Length，Accept-Ranges必须都有才可更改 currentTime。

                也就是说ie需要response header 有正确的Content-Type，Content-Length。
                chrome需要头部有Content-Length和Accept-Ranges。（Firefox没测）
                --------------------------------------------------*/

                lyricMatch(Math.round(parseFloat(audio.currentTime)));
            });
        });
    });
    return {
        init: function () {
            /*--阻止浏览器默认行为--*/
            $(document).on('touchstart touchmove', function (e) {
                e.preventDefault();
            });
            getNow();
            setInterval(getNow, 1000);
            computedLyricBox();
            discAnimation();

            $mute.on('tap', () => {
                if (audio.volume === 0) {
                    audio.volume = 1;
                    $mute.removeClass('icon-icon--4').addClass('icon-icon--6');
                } else {
                    audio.volume = 0;
                    $mute.removeClass('icon-icon--6').addClass('icon-icon--4');
                }
            });

            $play.on('tap', () => {

                if (audio.paused) {
                    audio.play();
                    $play.removeClass('icon-icon--5').addClass('icon-icon--7');
                    discAnimation();
                } else {
                    audio.pause();
                    $play.removeClass('icon-icon--7').addClass('icon-icon--5');
                    discAnimation();
                }
            });

            $playMode.on('tap', () => {
                if ($playMode.attr('playmode') === '0') { //0循环
                    $playMode.attr('playmode', '1');
                    $playMode.removeClass('icon-icon--1').addClass('icon-icon--10');
                } else if ($playMode.attr('playmode') === '1') { //1随机
                    $playMode.attr('playmode', '0');
                    $playMode.removeClass('icon-icon--10').addClass('icon-icon--1');
                }
            })


            //读取歌曲信息等数据
            $.ajax({
                url: 'data/songs.json',
                type: 'get',
                dataType: 'json',
                cache: false,
                success: result => {
                    // songsLength = result.length;
                    $plan.fire(result, songID = 0);
                }
            });
        }
    }
})(Zepto);

musicRender.init();


