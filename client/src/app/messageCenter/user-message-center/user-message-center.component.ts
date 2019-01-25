import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';
import { RequestService } from 'src/app/services/request.service';
import { TeamService } from 'src/app/services/team.service';
import { UtilitiesService } from 'src/app/services/utilities.service';

@Component({
  selector: 'app-user-message-center',
  templateUrl: './user-message-center.component.html',
  styleUrls: ['./user-message-center.component.css']
})
export class UserMessageCenterComponent implements OnInit {

  constructor(public util:UtilitiesService, public user:UserService, public team:TeamService, private request:RequestService, private auth:AuthService, private messageCenter:MessagesService, private notificationService:NotificationService) { }

  messages:any = [];
  selectedMessage;

  selectMessage(message){
    this.selectedMessage = message;
    this.messageCenter.markRead(message._id).subscribe(
      res=>{
        this.notificationService.updateMessages.next('Msg center updated');
        console.log('back from the message center ', res);
      },err=>{
        console.log(err);
      }
    )
  }

  deleteMessage(message){
    this.messageCenter.deleteMessage(message._id).subscribe(res=>{
      let ind = -1;
      this.messages.forEach((element, index) => {
        if(element._id==message._id){
          ind = index;
        }
      });
      if(ind>-1){
        this.messages.splice(ind, 1);
        if (this.selectedMessage._id == message._id){
          this.selectedMessage = null;
        }
      }
    },err=>{
      console.log(err);
    })
  }

  actionRequest(act, msg){
    if (this.selectedMessage.request.instance == 'team'){
      this.request.approveTeamRequest(msg.request.target, msg.request.requester, act, msg._id).subscribe((res) => {
        this.ngOnInit();
      }, (err) => {
        this.ngOnInit();
        console.log('err ', err);
      })
    } else if (this.selectedMessage.request.instance == 'user'){
      this.request.acceptTeamInvite(msg.request.target, msg.request.requester, act, msg._id).subscribe((res) => {
        this.ngOnInit();
      }, (err) => {
        this.ngOnInit();
        console.log('err ', err);
      });
    }

  }

  ngOnInit() {
    this.messages = [];
    this.selectedMessage = null;
    this.messageCenter.getMessages(this.auth.getUserId()).subscribe(
      res=>{
        this.messages = res;
        // console.log(res);
      },
      err=>{
        console.log(err);
      }
    )
  }

}