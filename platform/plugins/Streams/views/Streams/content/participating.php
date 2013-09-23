<script type="text/javascript">
	$(function(){
		$('#partTest').click(function() {
			Q.req('Streams/participating', 'streams,participating', function (response) {
				console.log(response.slots);
			});
		});

		$('#partTest2').click(function() {
			Q.jsonRequest('Streams/participating', 'participating', function (response) {
				console.log(response.slots);
			});
		});
	});
</script>

<input type="button" id="partTest" value="Test">
&nbsp;
<input type="button" id="partTest2" value="Test2"> 