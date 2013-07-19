$(function () {
    $("#J_navList").find('.item').click(function () {
        chrome.tabs.create({
            url: this.href
        }, function (tab) {
            chrome.windows.get(tab.windowId, function (win) {
            })
        });
        return false;
    });


    //进程数设置
    var curPro = $("#curPro");
    curPro.html((localStorage.getItem('proNumber') || 10));

    $("#J_btn").click(function () {
        localStorage.setItem('proNumber', $("#proNumber").val() || 10);
        curPro.html($("#proNumber").val() || 10);
    });

    //页数范围
    var startPage = $("#startPage"),
        endPage = $("#endPage");

    startPage.val(localStorage.getItem('startPage') || '');
    endPage.val(localStorage.getItem('endPage') || '');

    $("#J_btnPage").click(function () {
        localStorage.setItem('startPage', startPage.val() || 0);
        localStorage.setItem('endPage', endPage.val() || 0);
    });

});

