using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models.AccountViewModels
{
    public class ContactModel
    {
        public string ID { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public ContactStatus Status { get; set; }
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
