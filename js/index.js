$(function () {

    var pausebtn = $('<button>', {'html': '暂停','class':"btn"});
    var clearbtn = $('<button>', {'html': '清空','class':"btn"});
    var upbtn = $('<button>', {'html': '收起15秒','class':"btn"});

    var pauseValue = 0;//暂停按钮

    upbtn.click(function(){
        progress.slideUp();
        setTimeout(function(){
            progress.slideDown();
        },15000);
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


    var page = $('#page'), tmpCache = $("<div>");
    var table = $($("#tableTemplete").html());

    var proBar = '<p></p><div class="progress-bar blue stripes"><span></span></div>';
    var progress = $("<div>", {id: 'progress', html: proBar});

    progress.append(pausebtn);
    progress.append(clearbtn);
    progress.append(upbtn);

    page.append('<link rel="stylesheet" href="css/main.css"/>');

    page.append(table);

    var tbody = $('tbody', table);


    //页数范围
    var startPage=(localStorage.getItem('startPage')|| 0)-0,
        endPage=(localStorage.getItem('endPage')|| 0)-0;

    var totalPage = endPage,
        curPage = startPage;


    //获取请求
    var requestUrl = $("#requestUrl").val();

    //开始跑数据
    start();

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
    var items = $(".itmTable", tmpCache), trs = [];
    items.each(function () {
        var tds = [], arr = getItemData($(this));
        $.each(arr, function () {
            tds.push('<td>' + this + '</td>');
        });
        trs.push('<tr>' + tds.join('') + '</tr>');
    });
    return trs.join('');
}

/**
 * 获取两个 table对象 t1,t2
 * @param item
 * @returns {*}
 */
function getItemData(item) {
    var t1 = $('table.t1', item),
        t2 = $("table.t2", item);

    var t1Arr = getT1Data(t1);
    var t2Arr = getT2Data(t2);
//    console.log(t1Arr);
//    console.log(t2Arr);
    return t1Arr.concat(t2Arr);
}

/**
 * 获取第一种table 数据 t1
 * @param t1
 * @returns {Array}
 */
function getT1Data(t1) {
    var arr = [];
    $('th', t1).each(function () {
        arr.push($('strong', this).text().replace(/\s/ig, ''));
    });
    return arr;
}

/**
 * 获取第二种table数据 t2
 * @param t2
 * @returns {Array}
 */
function getT2Data(t2) {
    var tables = [];
    $('table.t3', t2).each(function (index, item) {
        var arr = getT3Data(this, index);
        if ($.isArray(arr)) {
            tables = tables.concat(arr);
        } else {
            tables.push(arr);
        }
    });
    return tables;
}

/**
 * 获取第三种table t3，选择相应的function处理数据
 * @param t3
 * @param index
 * @returns {*}
 */
function getT3Data(t3, index) {
    var fn = T3Functon['t3' + index];
    return fn(t3);
}

/**
 * 查找出 td，过滤汉字及返回td数组
 * @param item
 * @returns {Array}
 */
function getTdHTML(item) {
    var tds = [];
    if ($.isArray(item)) {
        $.each(item, function () {
            $(this).find('td').each(each)
        });
    } else {
        $(item).find('td').each(each);
    }

    return tds;

    function each() {
        var html = this.innerHTML;
        if (html.indexOf(':') > -1) {
            html = html.split(':')[1] || '';
        } else if (html.indexOf('：') > -1) {
            html = html.split('：')[1] || '';
        }
        html = html.replace(/(\&nbsp\;|\s|\-{2,})/ig, '');
        html = html.replace('人', '').replace('间', '').replace('元', '').replace('天', '');
        tds.push(html);
    }
}


function returnTableHTML(item) {
//    var $item = $(item);
//    $item.find('script').remove();

    return getTdHTML(item);

    //return '<table>' + $item.html().replace(/\s\n\r/ig, '') + '</table>';
}

/**
 * 过滤出汉字
 * @param str
 * @returns {*}
 */
function getNumByReg(str) {
    return str.replace(/[^0-9A-Za-z]/ig, "");
}

/**
 * table处理函数集合
 * @type {{t30: Function, t31: Function, t32: Function, t33: Function, t34: Function, t35: Function, t36: Function, t37: Function}}
 */
var T3Functon = {
    t30: function (item) {
        $('tr', item).each(function (index) {
            var td = this.getElementsByTagName('td')[0],
                $tr = $(this);

            if (index == 1 && $('.data', $tr).length == 0) {
                $tr.remove();
            } else if ($tr.hasClass('merge') && $tr.next().length) {
                var nextTd = $('td', $tr.next());
                nextTd.html(td.innerHTML + ',' + nextTd.html());
                $tr.remove();
            }
            else if ($.trim(td.innerHTML) == "" || td.innerHTML.indexOf('房价记录') > -1) {
                if (td.innerHTML.indexOf('房价记录') > -1) {
                    $tr.next().next().addClass('merge');
                }
                $tr.remove();
            } else if ($('label', td).length) {
                var label = $('label', td);
                var tr = $('<tr>').html('<td>' + label.html() + '</td>');
                label.remove();
                $tr.after(tr);
            } else if ($('a', td).length) {
                td.innerHTML = $tr.text();
            }
        });

        return returnTableHTML(item);
    },
    t31: function (item) {
        $('tr', item).each(function () {
            var td = this.getElementsByTagName('td')[0],
                $tr = $(this);
            var mail = $('.mail', $tr);
            //去除归属地 重复的td
            if (mail.length && $('.data', $tr.next()).length == 0) {
                $('td', $tr.next()).html('');
            }

            if ($.trim(td.innerHTML) == "" || td.innerHTML.indexOf('入住人信息') > -1 || td.innerHTML.indexOf('-------') > -1) {
//                debugger;
                $tr.remove();
            }
        });
        return returnTableHTML(item);
    },
    t32: function (item) {
        var mails = $('.mail', item);
        $('tr', item).each(function () {
            var tds = this.getElementsByTagName('td'),
                td = tds[0],
                $tr = $(this);
            var mail = $('.mail', $tr), nextTd = $('td', $tr.next());
            if (mails.index(mail) == 1 && !nextTd.hasClass('date')) {
                nextTd.html('');
                $tr.remove();
            } else if ($.trim(td.innerHTML) == "" || $('button', td).length) {
                if (mail.length && $('.data', $tr.next()).length == 0) {
                    //补全没有第二个电话号码的信息
                    if (mails.index(mail) == 0 && nextTd.html() == '') {
                        $tr.prev().append('<td></td><td></td>');
                    }
                    nextTd.html(getNumByReg(nextTd.html()));
                }
                $tr.remove();
            } else if ($('input', td).length || $('textarea', td).length) {
                var txt = $('input', td).val() || $('textarea', td).html();
                td.innerHTML = txt || '';
            } else if ($('a', td).length) {
                td.innerHTML = getNumByReg($tr.text());
            }
        });
        return returnTableHTML(item);

    },
    t33: function (item) {
        $('tr', item).each(function () {
            var tds = this.getElementsByTagName('td'),
                td = tds[0],
                $tr = $(this);
            if (tds.length > 1) {
                $tr.html("<td>" + tds[1].innerHTML + "</td>");
            } else if ($('select', td).length) {
                td.innerHTML = $('select option', td)[$('select', td)[0].selectedIndex].innerHTML;
            } else if ($('input', td).length || $('textarea', td).length) {
                var txt = $('input', td).val() || $('textarea', td).html();
                td.innerHTML = txt || '';
            }
            else if ($.trim(td.innerHTML) == "" || $('button', td).length) {
                $tr.remove();
            }
        });
        return returnTableHTML(item);

    },
    t34: function (item) {
        $('tr', item).each(function () {
            var tds = this.getElementsByTagName('td'),
                td = tds[0],
                $tr = $(this);

            if ($.trim(td.innerHTML) == "" || $('button', td).length) {
                $tr.remove();
            } else if ($('input', td).length || $('textarea', td).length) {
                var txt = $('input', td).val() || $('textarea', td).html();
                td.innerHTML = txt || '';
            }
        });
        return returnTableHTML(item);
    },
    t35: function (item) {
        $('tr', item).each(function () {
            var tds = this.getElementsByTagName('td'),
                td = tds[0],
                $tr = $(this);

            if ($.trim(td.innerHTML) == "" || $('button', td).length) {
                $tr.remove();
            } else if ($('input', td).length || $('textarea', td).length) {
                var txt = $('input', td).val() || $('textarea', td).html();
                td.innerHTML = txt || '';
            }
        });
        return returnTableHTML(item);
    },
    t36: function (item) {
        var tables = [];
        $('tr', item).each(function () {
            var tds = this.getElementsByTagName('td'),
                td = tds[0],
                $tr = $(this);

            if ($.trim(td.innerHTML) == "" || $('button', td).length) {
                $tr.remove();
            } else if ($('textarea', td).length) {
                var text = $('textarea:visible', td).html() || '';
                td.innerHTML = text;
//                tables.push('<table><tbody><tr>' + $tr.html() + '</tr></tbody></table>');
                tables.push($tr);
            } else if ($('select', td).length) {
                td.innerHTML = $('select option', td)[$('select', td)[0].selectedIndex].innerHTML;
//                tables.push('<table><tbody><tr>' + $tr.html() + '</tr></tbody></table>');
                tables.push($tr);
            }
        });
        return getTdHTML(tables);
    },
    t37: function (item) {
        var tables = [];
        $('tr', item).each(function () {
            var tds = this.getElementsByTagName('td'),
                td = tds[0],
                $tr = $(this);
            if ($.trim(td.innerHTML) == "" || $.trim(td.innerText).indexOf('租客：') == 0 || $.trim(td.innerText).indexOf('房东：') == 0 || td.innerHTML.indexOf('--------------------------------------') > -1) {
                $tr.remove();
            } else if ($('textarea', td).length) {
                var text = $('textarea', td).html() || '';
                td.innerHTML = text;
//                tables.push('<table><tbody><tr>' + $tr.html() + '</tr></tbody></table>');
                tables.push($tr);
                $tr.remove();
            } else if ($('label', td).length) {
                $('label', td).remove();
            }
            else {
                td.innerHTML = getNumByReg(td.innerHTML.split('.')[0]);
            }
        });
        return getTdHTML([item].concat(tables));
    }
};

function completeNotice(){
    var notification = webkitNotifications.createNotification(
        'icon.png',  // icon url - can be relative
        'Misson Completed!',  // notification title
        '完成!请ctrl+a,全选页面,ctrl+c复制到excel表格里.'  // notification body text
    );
    notification.show();
}
