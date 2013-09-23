<div class="Q_grammar_instructions">
	If you noticed an error on this page, please send a notification to the author by selecting the incorrect text,
	pressing Ctrl + Enter and submitting the form.
</div>
<div class="Q_grammar_dialog">
	<div class="title_slot">
	  <h2 class="Q_dialog_title">Grammar tool</h2>
	</div>
	<div class="dialog_slot Q_dialog_content">
	  <div class="Q_grammar_form Q_big_prompt">
	  	<div>
	  		<label for="Q_grammar_text">Incorrect text:</label>
	  	</div>
	  	<div>
	  		<input type="text" id="Q_grammar_text" />
	  	</div>
	  	<div>
	  		<label for="Q_grammar_comment">Comment (optional):</label>
	  	</div>
	  	<div>
				<input type="text" id="Q_grammar_comment" />
			</div>
	  	<div>
				<label for="Q_grammar_author">Author:</label>
			</div>
			<div>
				<select id="Q_grammar_author">
					<?php foreach ($authors as $author): ?>
					<option value="<?php echo $author['mail'] ?>"><?php echo $author['name'] ?></option>
					<?php endforeach ?>
				</select>
			</div>
			<div class="Q_grammar_send_block">
				<button id="Q_grammar_send">Send</button>&nbsp;&nbsp;&nbsp;
				<?php echo Q_Html::img('plugins/Q/img/throbbers/bars.gif') ?>
			</div>
		</table>
	</div>
</div>