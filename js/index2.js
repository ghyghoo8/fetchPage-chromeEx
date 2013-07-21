$(function () {

    var pausebtn = $('<button>', {'html': '暂停', 'class': "btn"});
    var clearbtn = $('<button>', {'html': '清空', 'class': "btn"});
    var upbtn = $('<button>', {'html': '收起15秒', 'class': "btn"});

    var exportExcel = $('<button>', {'html': '另存为html(需手动设置)', 'class': "btn"});

    var pauseValue = 0;//暂停按钮

    var page = $('#page'), tmpCache = $("<div>");
    var table = $($("#tableTemplete").html());

    var proBar = '<p></p><div class="progress-bar blue stripes"><span></span></div>';
    var progress = $("<div>", {id: 'progress', html: proBar});


    exportExcel.click(function () {
        var tableHTML = '<table border="1">' + table.html().replace(/[\t\r\n ]{2,}|[\t\r\n]/g, '') + '</table>';
        var bb = new Blob([ tableHTML ], { type: "text/csv;base64" });
        var bburl = window.webkitURL.createObjectURL(bb);
        window.open(bburl);
//        document.location.href = bburl;
    });

    upbtn.click(function () {
        progress.slideUp();
        setTimeout(function () {
            progress.slideDown();
        }, 15000);
    });

    clearbtn.click(function () {
        tbody.html('');
    });

    pausebtn.click(function () {
        if (pauseValue) {
            pauseValue = 0;
            this.innerHTML = '暂停';
            start();
        } else {
            pauseValue = 1;
            this.innerHTML = '执行';
        }

    });

    progress.append(pausebtn);
    progress.append(clearbtn);
    progress.append(upbtn);
    progress.append(exportExcel);

    page.append('<link rel="stylesheet" href="css/main.css"/>');

    page.append(table);

    var tbody = $('tbody', table);


    //页数范围
    var startPage = (localStorage.getItem('startPage') || 0) - 0,
        endPage = (localStorage.getItem('endPage') || 0) - 0;

    var totalPage = endPage,
        curPage = startPage;


    //获取请求
    var requestUrl = $("#requestUrl").val();

    //开始跑数据
    start();
//    completeNotice()

    function start() {
        $('body').prepend(progress);
        sendRequest(requestUrl);
    }

    function takeWithResp(response) {
        var htmls = response.htmls;
        curPage = response.curPage;
//        console.log(html);

        $(htmls).each(function (index, html) {
            tmpCache.html(html);
            if (totalPage == 0) {
                totalPage = tmpCache.find('.paginateButtons:eq(0)').find('a.step:last').text() - 0;
//            console.log(totalPage);
            }
            tbody.append(makeTrsInTbody(tmpCache));
        });

        //调用进程函数继续
        setProgress();
    }

    function sendRequest(requestUrl) {
//        var page = getCurPage();
        chrome.extension.sendRequest({requestUrl: requestUrl, curPage: curPage}, takeWithResp);
    }

    function setProgress() {
        var num = totalPage ? ((curPage * 100) / totalPage).toFixed(2) : 0;
        progress.find('p').html('当前页：' + curPage + ' / ' + totalPage);
        progress.find('span').width(num + "%");

        var title = document.title;
        document.title = title.split('-')[0] + '-' + (num + "%");

        if (totalPage == 0 || curPage < totalPage) {
            if (pauseValue == 0)sendRequest(requestUrl);
        } else {
            progress.find('span').width(100 + "%");
//            progress.slideUp();
            completeNotice();
        }
    }

    function getCurPage() {
        var page = curPage++;
        return page + '0';
    }
});


/**
 * 制作tr-td，并插入table
 * @param tmpCache
 * @returns {string}
 */
function makeTrsInTbody(tmpCache) {
    var table = $(".list table", tmpCache), trs = [];
    tmpCache.find('td').show();
    table.find('tbody').find('tr').each(function () {
        var $tr = $(this),
            trHTML = clearHTMLByReg($tr.html());
        trs.push('<tr>' + trHTML + '</tr>');
    });
    return trs.join('');
}


function clearHTMLByReg(html) {
    var html = html;
    html = html.replace(/<a.*?>(.*?)<\/a>/ig, "$1");
    html = html.replace(/<br>/ig, "");
    html = html.replace('编辑', "");
    return html;
}


function completeNotice() {
    var notification = webkitNotifications.createNotification(
        'icon.png',  // icon url - can be relative
        'Misson Completed!',  // notification title
        '完成扫描,请ctrl+a,全选页面,ctrl+c复制到excel表格里.'  // notification body text
    );
    notification.show();
}