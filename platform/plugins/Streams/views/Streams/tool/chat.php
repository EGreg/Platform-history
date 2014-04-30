<div class="Streams_chat_listing_wrapper">
	<ul class="Streams_chat_listing">
		<?php if ($params['loadMore'] == 'pull'): ?>
		<li class="Streams_chat_pull_down">
			<div class="Streams_chat_pull_down_icon"></div>
		 	<span class="Streams_chat_pull_down_label">Pull down to load earlier messages</span>
		</li>
		<?php elseif ($params['loadMore'] == 'scroll' || $params['loadMore'] == 'click'): ?>
			<li class="Streams_chat_click_to_load">
				<div class="Streams_chat_load_spinner"></div>
				<span class="Streams_chat_pull_down_label">Click to load earlier messages</span>
			</li>
		<?php endif ?>
		<?php $at_least_one_message = false ?>
		<?php if (!empty($messages)): ?>
		<?php foreach ($messages as $message): ?>
		<?php $at_least_one_message = true ?>
		<li class="Streams_chat_message Q_clearfix" data-ordinal="<?php echo $message->ordinal ?>">
			<div class="Streams_chat_date"><?php echo date('m/d/y', strtotime($message->sentTime)) ?></div>
			<?php $u = Users_User::getUser($message->byUserId) ?>
			<?php echo Q::tool('Users/avatar', array('userId' => $u->id, 'icon' => '40'), array('id' => $message->ordinal)) ?>
			<div class="Streams_chat_post">
				<p><?php echo $message->content ?></p>
			</div>
		</li>
		<?php endforeach ?>
		<?php endif ?>
		<?php if (!$at_least_one_message): ?>
		<li class="Streams_chat_message Streams_chat_no_messages Q_clearfix">

		</li>
		<?php endif ?>
	</ul>
	<div class="Streams_chat_comment_form Q_clearfix">
		<div class="Streams_chat_avatar">
			<?php echo Q_Html::img('plugins/Users/img/icons/user-' . $user->id . '/40.png') ?>
		</div>
		<div class="Streams_chat_comment_text">
			<span class="Streams_chat_username"><?php echo Streams::displayName($user->id) ?></span><br />
			<textarea id="Streams_chat_textarea" placeholder="Leave a comment..."></textarea>
		</div>
	</div>
	<?php if (Q_Request::isTouchscreen()) :?>
	<div>&nbsp;</div>
	<?php endif ?>
</div>