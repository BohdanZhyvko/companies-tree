//JSTree print tree
// ajax get json from url and print jstree
$('#get-jstree-ajax').jstree({
	'core' : {
		'data' : {
      "url" : "http://localhost:8000/json",
			"dataType": "json"
    }
  }
});

//collapse and expand branches from button
$('#button-collapse').on("click",function () {
  if ($(this).val() == 'Collapse All') {
    $('#get-jstree-ajax').jstree('open_all');
    $(this).val('Expand All');
  } else {
    $('#get-jstree-ajax').jstree('close_all');
    $(this).val('Collapse All');
  }
});
