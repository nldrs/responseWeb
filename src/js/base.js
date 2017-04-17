;(function($,doc,win){
    var $form_add_task=$(".add-task");
    var task_list=[];
    var currentIndex;
    init();
    $form_add_task.on("submit",function (e) {
        var new_task={};
        var $input=$(this).find("input");
        e.preventDefault();
        new_task.content=$input.val();
        if(!new_task.content) return;
    //   存入新的task
       if(add_task(new_task)){
           $input.val(null);
       }
    });
    $(".task-list").on("click",".del-task",function(){
      var index= $(this).parents(".task-item").data("index");
        del_task(index);
    });
    $(".task-list").on("click",".detail-task",function () {
        var index= $(this).parents(".task-item").data("index");
        currentIndex=index;
        show_detail(index);
    });
    $(".task-list").on("click",".check",function(e){
        e.stopPropagation();
        var index=$(this).parents(".task-item").data("index");
        var item=getItem(index);
        if(item.complete){
            updata(index,{complete:false});
        }else{
            updata(index,{complete:true});
        }
    })
    function getItem(index){
        return store.get('task_item')[index];
    }
    $(".task-mask").on("click",function () {
        $(".task-mask,.task-detail").hide();
    })
    $(".task-detail").on("submit",".updata",function (e) {
        e.preventDefault();
        var $inputFlag=$(this).find(".edit-content input").val();
        var obj={};
        if(($inputFlag=="")||($inputFlag=="undefined")){
            obj.content=$(this).find(".content").text();
        }else{
            obj.content=$inputFlag;
        }
        obj.desc=$(this).find("textarea").val();
        obj.remind=$(this).find(".edit-date").val();
        updata(currentIndex,obj)
    })
    $(".task-detail").on("dblclick",".content",function(e){
        // e.stopPropagation();
       $(this).hide().next().show();
    })
    $(".task-list").on("dblclick",".task-item",function () {
        var index=$(this).data("index");
        show_detail(index);
    })
    $(".msg-remind").on("click",function () {
        $(".msg").hide();
    })
    function show_detail(index){
        if(index=="undefined"||!task_list[index]){
            return;
        }
        render_detailTask(index);
        $(".task-mask,.task-detail").show();
    }
    function render_detailTask(index){
        if(index=="undefined"||!task_list[index]){
            return;
        }
        $(".task-detail").empty();
        var detail_tpl=
        '<form class="updata">'
        +'<div class="content">'+task_list[index].content+'</div>'
        +'<div class="edit-content"><input type="text"></div>'
        +'<div>'
        +'<textarea class="desc">'+(task_list[index].desc||"")+'</textarea>'
        +'</div>'
        +'<div class="task-remind">'
        +'<input class="edit-date" type="text" value="'+(task_list[index].remind||"")+'">'
        +'<button type="submit" class="updata-btn">更新</button>'
        +'</div>'
        +'</form>';
        $(".task-detail").append(detail_tpl);

        $(".edit-date").datetimepicker({lang:'ch'});
    }
    function updata(index,data) {
        if(index=="undefined"||!task_list[index]){
            return;
        }
        task_list[index]=$.extend({},task_list[index],data);
        refresh();
        $(".task-mask,.task-detail").hide();
        // console.log(task_list)
    }
    function add_task(new_task){
        task_list.push(new_task);
        refresh();
        return true;
    }
    function init() {
        task_list=store.get('task_item')||[];
        refresh();
        check_remind();
    }
    function pop(arg){
        var config={},$box,$mask,$body=$("body"),
            $window=$(window),$dfd,confirmed,timer2;
        $dfd=$.Deferred();
        if(!arg){
            console.log("必须传入参数");
        }
        if( typeof arg=="string"){
            config.title=arg;
        }else{
            config=$.extend(config,arg);
        }
        $box=$(
            '<div>' +
            '<div class="pop-title" style="padding:5px 10px;font-weight: 800;font-size: 20px;text-align: center;">'+config.title+'</div>' +
            '<div class="pop-content" style="padding: 5px 10px;text-align: center;">' +
            '<div>' +
            '<button class="pop-btn confirm">确定</button><button class="pop-btn cancle">取消</button>' +
            '</div>' +
            '</div>' +
            '</div>'
        ).css({
            "position":"fixed",
            "width":300,
            "height":"auto",
            "backgroundColor":"#fff",
            "borderRadius":"3px",
            "boxShadow":"1px 2px 1px rgba(0,0,0,.2)"
        });
        $mask=$('<div class="pop-mask"></div>').css({
            "position":'fixed',
            "left":0,
            "top":0,
            "bottom":0,
            "right":0,
             "backgroundColor":"rgba(0,0,0,.5)"
        });
        timer2=setInterval(function () {
            if(confirmed!==undefined){
                $dfd.resolve(confirmed);
                clearInterval(timer2);
                dismiss_pop();
            }
        },50);
        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }
        function adjust() {
            $window_w=$window.width();
            $window_h=$window.height();
            $box_w=$box.width();
            $box_h=$box.height();
            var adjust_x=($window_w-$box_w)/2;
            var adjust_y=($window_h-$box_h)/2-20;
            $box.css({
                left:adjust_x+"px",
                top:adjust_y+"px"
            })
        }
        $(window).resize(function(){
            adjust();
        });
        $body.append($mask);
        $body.append($box);
        $(".pop-btn.confirm").on("click",function(){
            confirmed=true;
        });
        $(".pop-btn.cancle,.pop-mask").on("click",function(){
            confirmed=false;
        });
        adjust();
        return  $dfd.promise();
    }
    function check_remind() {
        var nowTime;
        var timer=setInterval(function () {
            nowTime=(new Date()).getTime();
            for(var i=0;i<task_list.length;i++){
                var item=getItem(i);
                if(!item||!item.remind||item.info) continue;
                var setTime=(new Date(item.remind)).getTime();
                if(nowTime-setTime>=1){
                    updata(i,{info:true});
                    notice(item.content);
                }
            }
        },300);
    }
    function notice(msg) {
        if(!msg) return;
       $(".msg-content").text(msg);
        $(".msg").show();
    }
    function render_task() {
    //   迭代单个模板
        var $taskContainer=$(".task-list");
        var completeArr=[];
        $taskContainer.empty();
        for(var i=0;i<task_list.length;i++){
            if(task_list[i]&&task_list[i].complete){
                completeArr[i]=task_list[i];
            }else{
                var $taskitem=render_task_tpl(task_list[i],i);
                $taskContainer.prepend($taskitem);
            }
        }
        for(var j=0;j<completeArr.length;j++){
            $taskitem=render_task_tpl(completeArr[j],j);
            if(!$taskitem) continue;
            $taskitem.addClass("signComplete");
            $taskContainer.append($taskitem);
        }
    }
    function render_task_tpl(data,index){
        if(!data||index==undefined) return;
        var tpl='<div class="task-item" data-index="'+index+'">'
            +'<span><input type="checkbox" class="check" '+(data.complete?"checked":"")+'></span>'
            +'<span class="task-content">'+data.content+'</span>'
            +'<span class="action">'
            +'<span class="del-task">删除</span>'
            +'<span class="detail-task">详情</span>'
            +'</span>'
            +'</div>';
        return $(tpl);
    }
    function refresh(){
        store.set("task_item",task_list);
        render_task();
    }
    function del_task(index) {
        if(index==undefined||!task_list[index]){
            return;
        }
        pop("您确定要删除吗？")
            .then(function(r){
            r?delete task_list[index]:null;
            refresh();
        })
    }
})(jQuery,document,window);
