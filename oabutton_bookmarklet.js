var oabutton_bookmarklet = function(apikey,apiaddr,siteaddr) {
  var popup = document.createElement('div');
  popup.setAttribute('id','oabutton_popup');
  popup.innerHTML = '\
    <h2 style="font-weight:normal;background-color:white;margin:-10px -10px 0px -10px;padding:20px 0px 20px 5px;"><img src="../img/oa128.png" style="width:40px;"> Open Access Button</h2> \
    <div id="loading_area" style="margin:5px -10px 10px -10px;"> \
      <img id="icon_loading" style="width:150px;margin:20px auto 10px 110px;" src="../img/spin_orange.svg"> \
    </div> \
    <div class="collapse" id="buttonstatus" style="margin:5px -10px 10px -10px;min-height:180px;"> \
      <a href="#" id="iconarticle" class="well need" data-type="article" alt="Sorry, we couldn\'t find it. Click to start a new request" title="Sorry, we couldn\'t find it. Click to start a new request"> \
        <img style="height:100px;width:80px;margin-bottom:12px;" src="../img/oab_article.png"><br> \
        Request article \
      </a> \
      <a href="#" id="icondata" class="well need" data-type="data" alt="Sorry, we couldn\'t find it. Click to start a new request" title="Sorry, we couldn\'t find it. Click to start a new request"> \
        <img style="height:110px;width:80px;margin-top:2px;" src="../img/oab_data.png"><br> \
        Request data \
      </a> \
    </div> \
    <div id="message" style="margin-top:5px;"></div> \
    <div class="collapse" id="story_div"> \
      <textarea id="story" placeholder="How would getting access to this research help you? This message will be sent to the author."></textarea> \
      <button type="submit" id="submit" style="margin-top:5px;background-color:#f04717;" disabled>Tell us your story in up to <br><span id="counter">25</span> words to create this request</button> \
    </div> \
    <p> \
      <a href="#" id="close" style="font-size:18px;font-weight:bold;color:#999;" alt="close Open Access Button" title="close Open Access Button">x |</a> \
      <a href="#" id="bug" style="font-size:14px;">File a bug</a> \
    </p>';
  document.body.appendChild(popup);
  
  function handleAvailabilityResponse(response) {
    document.getElementById('buttonstatus').className = document.getElementById('buttonstatus').className.replace('collapse','').replace('  ',' ');
    document.getElementById('loading_area').className = 'row collapse';
    if (response.data.availability.length > 0) {
      var title = 'We found it! Click to open';
      for ( var i = 0; i < response.data.availability.length; i++ ) {
        document.getElementById('icon'+response.data.availability[i].type).style.backgroundColor = '#398bc5';
        document.getElementById('icon'+response.data.availability[i].type).setAttribute('alt',title);
        document.getElementById('icon'+response.data.availability[i].type).setAttribute('title',title);
        document.getElementById('icon'+response.data.availability[i].type ).setAttribute('href',response.data.availability[i].url);
      }
    } else if (response.data.requests.length > 0) {
      for (var requests_entry of response.data.requests) {
        if (requests_entry.usupport || requests_entry.ucreated) {
          document.getElementById('icon'+requests_entry.type).setAttribute('href',oab.site_address+'/request/'+requests_entry._id);
        } else {
          document.getElementById('icon'+requests_entry.type).setAttribute('data-action','support');
          document.getElementById('submit').setAttribute('data-action','support');
          document.getElementById('submit').setAttribute('data-support',requests_entry._id);
        }
      }
    } else if (response.data.accepts.length > 0) {
      for (var accepts_entry of response.data.accepts) {
        document.getElementById('icon'+accepts_entry.type).setAttribute('data-action','create');
        document.getElementById('submit').setAttribute('data-action','create');
      }
    } else {
      oab.displayMessage("Sorry, something went wrong with the API.")
    }
  }

  function handleRequestResponse(response) {
    document.getElementById('story_div').className += ' collapse';
    document.getElementById('story').value = "";
    var url = oab.site_address + '/request/' + response._id;
    var msg = "<p>Thanks very much for ";
    msg += document.getElementById('submit').getAttribute('data-action') === 'create' ? 'creat' : 'support';
    msg += "ing this request!</p>";
    msg += "<p>Please take a moment to go and view the request, and provide any additional support that you can.</p>"
    msg += '<p>We have opened it up in a new tab for you. If your browser blocked it, you can open it <a class="label label-info" target="_blank" href="' + url + '">here</a>';
    document.getElementById('message').innerHTML = msg;
    window.open(url,'_blank');
  }

  page_url = window.location.href.split('#')[0];
  oab.api_address = apiaddr;
  oab.site_address = siteaddr;
  oab.sendAvailabilityQuery(apikey, page_url, handleAvailabilityResponse, oab.handleAPIError);

  // =============================================
  // bind actions to the elements

  var needs = document.getElementsByClassName('need');
  for ( var n in needs ) {
    needs[n].onclick = function(e) {
      var href = e.target.getAttribute('href');
      if (!href) href = e.target.parentNode.getAttribute('href');
      if ( href === '#' && apikey ) {
        e.preventDefault();
        var action = e.target.getAttribute('data-action');
        if (!action) action = e.target.parentNode.getAttribute('data-action');
        var type = e.target.getAttribute('data-type');
        if (!type) type = e.target.parentNode.getAttribute('data-type');
        var ask = action === 'support' ? 'There is an open request for this ' + type + '. Add your support. ' : 'Create a new ' + type + ' request. ';
        ask += 'How would getting access to this ' + type + ' help you? This message will be sent to the author.';
        document.getElementById('story').setAttribute('placeholder',ask);
        document.getElementById('submit').setAttribute('data-type',type);
        if ( action === 'support' ) {
          document.getElementById('submit').innerHTML = document.getElementById('submit').innerHTML.replace('create','support');
        } else {
          document.getElementById('submit').innerHTML = document.getElementById('submit').innerHTML.replace('support','create');
        }
        document.getElementById('story_div').className = document.getElementById('story_div').className.replace('collapse','').replace('  ',' ');
      }
    }
  }

  document.getElementById('close').onclick = function (e) {
    e.preventDefault();
    var element = document.getElementById("oabutton_popup");
    element.parentNode.removeChild(element);
  }

  document.getElementById('submit').onclick = function (e) {
    var data = {
      story: document.getElementById('story').value
    };
    var action = document.getElementById('submit').getAttribute('data-action');
    if ( action === 'create' ) {
      data.type = document.getElementById('submit').getAttribute('data-type');
      data.url = page_url;
      try {
        chrome.storage.local.get({dom : ''}, function(items) {
          if (items.dom !== '') data.dom = items.dom;
          oab.sendRequestPost(api_key, data, handleRequestResponse, oab.handleAPIError);
        });
      } catch (err) {
        oab.sendRequestPost(api_key, data, handleRequestResponse, oab.handleAPIError);
      }
    } else {
      data._id = document.getElementById('submit').getAttribute('data-support');
      oab.sendSupportPost(api_key, data, handleRequestResponse, oab.handleAPIError);
    }
  };

  document.getElementById('bug').setAttribute('href',oab.site_address + oab.bug_address);

  document.getElementById('story').onkeyup = function () {
    var length = document.getElementById('story').value.replace(/  +/g,' ').split(' ').length;
    var left = 25 - length;
    if (left < 0) {
      left = 0;
    }
    if (length === 0) {
      document.getElementById('submit').innerHTML = 'Tell us your story in up to <br><span id="counter">25</span> words to support this request';
      document.getElementById('submit').style.backgroundColor = '#f04717'; 
    }
    if (length <= 5) {
      document.getElementById('submit').innerHTML = 'Tell us your story with up to <span id="counter"></span><br> more words to support this request';
      document.getElementById('submit').style.backgroundColor = '#f04717'; 
    }
    if ( left < 25 && length > 5 ) {
      document.getElementById('submit').removeAttribute('disabled');
    } else {
      document.getElementById('submit').setAttribute('disabled',true);
    }
    if (length > 5 && length <= 10) {
      document.getElementById('submit').innerHTML = 'Great, <span id="counter"></span> words remaining!<br>Write 5 more?';
      document.getElementById('submit').style.backgroundColor = '#ffff66'; 
    }
    if (length > 10 && length <= 20) {
      document.getElementById('submit').innerHTML = '<span id="counter"></span> words left! Or click to submit<br>now and create your request!';
      document.getElementById('submit').style.backgroundColor = '#99ff99'; 
    }
    if (length > 20) {
      document.getElementById('submit').innerHTML('<span id="counter"></span>... Click now to submit your<br>story and create your request');
      document.getElementById('submit').style.backgroundColor = '#99ff99'; 
    }
    document.getElementById('counter').innerHTML = left;
  };



}
oabutton_bookmarklet(apikey,api,url);