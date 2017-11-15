using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models
{
    public class ContactModel
    {
        public string User_ID { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public ContactStatus Status { get; set; }
        public string UUID { get; set; }

        [Key]
        public string ContactUUID { get; set; } //Should be combined uuid of User_ID and UUID of contacted user.
    }
    public enum ContactStatus
    {
        Submitted,
        Approved,
        Rejected
    }

    public class ContactViewModel : ContactModel
    {
        public string Profilepicture { get; set; }
    }

}
